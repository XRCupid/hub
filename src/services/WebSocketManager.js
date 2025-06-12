// WebSocketManager.js - Centralized WebSocket connection manager for Hume AI

class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.subscribers = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second delay
    this.maxReconnectDelay = 30000; // Max 30 seconds delay
  }

  /**
   * Get or create a WebSocket connection
   * @param {string} url - WebSocket URL
   * @param {string} type - Connection type (e.g., 'facial', 'prosody', 'evi')
   * @returns {WebSocket} The WebSocket instance
   */
  getConnection(url, type) {
    const connectionKey = `${type}:${url}`;
    
    // Return existing connection if available and open
    if (this.connections.has(connectionKey)) {
      const { socket } = this.connections.get(connectionKey);
      if (socket.readyState === WebSocket.OPEN) {
        return socket;
      }
      // Clean up dead connection
      this.connections.delete(connectionKey);
    }

    // Create new connection
    console.log(`[WebSocketManager] Creating new ${type} connection to ${url}`);
    const socket = new WebSocket(url);
    
    // Initialize connection state
    this.connections.set(connectionKey, {
      socket,
      type,
      url,
      isAlive: false,
      lastPing: Date.now(),
      pingInterval: null
    });
    
    // Reset reconnect attempts for this connection
    this.reconnectAttempts.set(connectionKey, 0);
    
    // Set up event handlers
    this.setupEventHandlers(socket, connectionKey);
    
    return socket;
  }

  /**
   * Set up WebSocket event handlers
   * @private
   */
  setupEventHandlers(socket, connectionKey) {
    const connection = this.connections.get(connectionKey);
    if (!connection) return;

    socket.onopen = () => {
      console.log(`[WebSocketManager] ${connection.type} connection opened to ${connection.url}`);
      connection.isAlive = true;
      this.reconnectAttempts.set(connectionKey, 0);
      
      // Start ping-pong to keep connection alive
      if (connection.pingInterval) {
        clearInterval(connection.pingInterval);
      }
      
      connection.pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(JSON.stringify({ type: 'ping' }));
            connection.lastPing = Date.now();
          } catch (error) {
            console.error(`[WebSocketManager] Error sending ping:`, error);
          }
        }
      }, 30000); // Send ping every 30 seconds
      
      this.notifySubscribers(connectionKey, { type: 'open' });
    };

    socket.onmessage = (event) => {
      connection.lastPing = Date.now();
      
      // Handle pong messages
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') {
          return; // Ignore pong messages
        }
      } catch (error) {
        // Not a JSON message, forward as is
      }
      
      this.notifySubscribers(connectionKey, { type: 'message', data: event.data });
    };

    socket.onerror = (error) => {
      console.error(`[WebSocketManager] ${connection.type} connection error:`, error);
      this.notifySubscribers(connectionKey, { type: 'error', error });
    };

    socket.onclose = (event) => {
      console.log(`[WebSocketManager] ${connection.type} connection closed:`, event.code, event.reason);
      
      // Clean up
      if (connection.pingInterval) {
        clearInterval(connection.pingInterval);
        connection.pingInterval = null;
      }
      
      connection.isAlive = false;
      
      // Notify subscribers
      this.notifySubscribers(connectionKey, { 
        type: 'close', 
        code: event.code, 
        reason: event.reason 
      });
      
      // Attempt to reconnect if not explicitly closed
      if (event.code !== 1000) { // 1000 = Normal closure
        this.attemptReconnect(connectionKey);
      }
    };
  }

  /**
   * Attempt to reconnect a closed connection
   * @private
   */
  attemptReconnect(connectionKey) {
    const connection = this.connections.get(connectionKey);
    if (!connection) return;
    
    const attempts = (this.reconnectAttempts.get(connectionKey) || 0) + 1;
    this.reconnectAttempts.set(connectionKey, attempts);
    
    if (attempts > this.maxReconnectAttempts) {
      console.error(`[WebSocketManager] Max reconnection attempts (${this.maxReconnectAttempts}) reached for ${connectionKey}`);
      this.notifySubscribers(connectionKey, { 
        type: 'reconnect_failed',
        attempts,
        maxAttempts: this.maxReconnectAttempts
      });
      return;
    }
    
    // Exponential backoff with jitter
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, attempts - 1) + Math.random() * 1000,
      this.maxReconnectDelay
    );
    
    console.log(`[WebSocketManager] Attempting to reconnect ${connectionKey} (attempt ${attempts}/${this.maxReconnectAttempts}) in ${Math.round(delay)}ms`);
    
    setTimeout(() => {
      if (connection.socket.readyState === WebSocket.CLOSED) {
        // Create new connection
        const newSocket = new WebSocket(connection.url);
        connection.socket = newSocket;
        this.setupEventHandlers(newSocket, connectionKey);
      }
    }, delay);
  }

  /**
   * Subscribe to WebSocket events
   * @param {string} connectionKey - Connection identifier
   * @param {Function} callback - Callback function for events
   * @returns {Function} Unsubscribe function
   */
  subscribe(connectionKey, callback) {
    if (!this.subscribers.has(connectionKey)) {
      this.subscribers.set(connectionKey, new Set());
    }
    
    this.subscribers.get(connectionKey).add(callback);
    
    // Return unsubscribe function
    return () => {
      if (this.subscribers.has(connectionKey)) {
        const callbacks = this.subscribers.get(connectionKey);
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(connectionKey);
        }
      }
    };
  }

  /**
   * Notify all subscribers of an event
   * @private
   */
  notifySubscribers(connectionKey, event) {
    if (!this.subscribers.has(connectionKey)) return;
    
    for (const callback of this.subscribers.get(connectionKey)) {
      try {
        callback(event);
      } catch (error) {
        console.error(`[WebSocketManager] Error in subscriber callback:`, error);
      }
    }
  }

  /**
   * Close a WebSocket connection
   * @param {string} connectionKey - Connection identifier
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  closeConnection(connectionKey, code = 1000, reason = 'Normal closure') {
    if (!this.connections.has(connectionKey)) return;
    
    const connection = this.connections.get(connectionKey);
    
    // Clean up
    if (connection.pingInterval) {
      clearInterval(connection.pingInterval);
      connection.pingInterval = null;
    }
    
    // Close socket if open
    if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.close(code, reason);
    }
    
    // Remove from connections
    this.connections.delete(connectionKey);
    this.reconnectAttempts.delete(connectionKey);
    
    console.log(`[WebSocketManager] Closed connection: ${connectionKey}`);
  }

  /**
   * Close all WebSocket connections
   */
  closeAllConnections() {
    for (const [connectionKey] of this.connections) {
      this.closeConnection(connectionKey, 1000, 'Application shutdown');
    }
  }
}

// Export a singleton instance
export const webSocketManager = new WebSocketManager();

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    webSocketManager.closeAllConnections();
  });
}

export default webSocketManager;
