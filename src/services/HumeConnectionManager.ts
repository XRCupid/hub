/**
 * Centralized Hume Connection Manager
 * 
 * This service manages ALL Hume voice connections to prevent the dreaded
 * "too many active chats" error during investor demos.
 * 
 * Key Features:
 * - Connection pooling and reuse
 * - Automatic cleanup on page unload
 * - Force cleanup utilities
 * - Connection health monitoring
 * - Emergency connection reset
 */

import { HybridVoiceService } from './hybridVoiceService';

interface ManagedConnection {
  id: string;
  service: HybridVoiceService;
  componentId: string;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
  cleanup: () => Promise<void>;
}

class HumeConnectionManager {
  private connections: Map<string, ManagedConnection> = new Map();
  private readonly MAX_CONNECTIONS = 4; // Keep 1 slot free
  private readonly CONNECTION_TIMEOUT = 300000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor() {
    this.initializeCleanupHandlers();
    this.startPeriodicCleanup();
  }

  /**
   * Get or create a Hume connection for a component
   */
  async getConnection(componentId: string, configId?: string): Promise<HybridVoiceService> {
    console.log(`[HumeConnectionManager] Requesting connection for ${componentId}`);
    
    // Check if component already has a connection
    const existingConnectionId = this.findConnectionByComponent(componentId);
    if (existingConnectionId) {
      const connection = this.connections.get(existingConnectionId);
      if (connection && connection.isActive) {
        console.log(`[HumeConnectionManager] Reusing existing connection for ${componentId}`);
        connection.lastUsed = Date.now();
        return connection.service;
      }
    }

    // Clean up old/stale connections before creating new one
    await this.cleanupStaleConnections();

    // Force cleanup if at limit
    if (this.connections.size >= this.MAX_CONNECTIONS) {
      console.warn(`[HumeConnectionManager] At connection limit, force cleaning oldest`);
      await this.forceCleanupOldest();
    }

    // Create new connection
    return this.createNewConnection(componentId, configId);
  }

  /**
   * Create a new managed connection
   */
  private async createNewConnection(componentId: string, configId?: string): Promise<HybridVoiceService> {
    const connectionId = `${componentId}_${Date.now()}`;
    
    console.log(`[HumeConnectionManager] Creating new connection ${connectionId}`);
    
    const service = new HybridVoiceService();
    
    // Create cleanup function
    const cleanup = async () => {
      console.log(`[HumeConnectionManager] Cleaning up connection ${connectionId}`);
      try {
        await service.disconnect();
        await service.cleanup();
      } catch (error) {
        console.warn(`[HumeConnectionManager] Error during cleanup:`, error);
      }
      this.connections.delete(connectionId);
    };

    // Store managed connection
    const managedConnection: ManagedConnection = {
      id: connectionId,
      service,
      componentId,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      isActive: true,
      cleanup
    };

    this.connections.set(connectionId, managedConnection);

    // Set up automatic cleanup when service disconnects
    service.on('disconnected', () => {
      console.log(`[HumeConnectionManager] Service disconnected, marking inactive: ${connectionId}`);
      if (this.connections.has(connectionId)) {
        this.connections.get(connectionId)!.isActive = false;
      }
    });

    return service;
  }

  /**
   * Release a connection when component unmounts
   */
  async releaseConnection(componentId: string): Promise<void> {
    console.log(`[HumeConnectionManager] Releasing connection for ${componentId}`);
    
    const connectionId = this.findConnectionByComponent(componentId);
    if (connectionId) {
      const connection = this.connections.get(connectionId);
      if (connection) {
        await connection.cleanup();
      }
    }
  }

  /**
   * Find connection by component ID
   */
  private findConnectionByComponent(componentId: string): string | null {
    for (const [id, connection] of this.connections) {
      if (connection.componentId === componentId) {
        return id;
      }
    }
    return null;
  }

  /**
   * Clean up stale connections
   */
  private async cleanupStaleConnections(): Promise<void> {
    const now = Date.now();
    const staleConnections: string[] = [];

    for (const [id, connection] of this.connections) {
      const age = now - connection.lastUsed;
      if (!connection.isActive || age > this.CONNECTION_TIMEOUT) {
        staleConnections.push(id);
      }
    }

    console.log(`[HumeConnectionManager] Cleaning up ${staleConnections.length} stale connections`);
    
    for (const id of staleConnections) {
      const connection = this.connections.get(id);
      if (connection) {
        await connection.cleanup();
      }
    }
  }

  /**
   * Force cleanup of oldest connection
   */
  private async forceCleanupOldest(): Promise<void> {
    let oldestId: string | null = null;
    let oldestTime = Date.now();

    for (const [id, connection] of this.connections) {
      if (connection.lastUsed < oldestTime) {
        oldestTime = connection.lastUsed;
        oldestId = id;
      }
    }

    if (oldestId) {
      console.log(`[HumeConnectionManager] Force cleaning up oldest connection: ${oldestId}`);
      const connection = this.connections.get(oldestId);
      if (connection) {
        await connection.cleanup();
      }
    }
  }

  /**
   * Emergency: Close ALL connections
   */
  async emergencyCleanupAll(): Promise<void> {
    console.log(`[HumeConnectionManager] 🚨 EMERGENCY CLEANUP - Closing all ${this.connections.size} connections`);
    
    this.isShuttingDown = true;
    
    const cleanupPromises = Array.from(this.connections.values()).map(conn => 
      conn.cleanup().catch(err => console.warn('Cleanup error:', err))
    );
    
    await Promise.all(cleanupPromises);
    this.connections.clear();
    
    console.log(`[HumeConnectionManager] ✅ Emergency cleanup complete`);
    this.isShuttingDown = false;
  }

  /**
   * Get connection status for debugging
   */
  getConnectionStatus(): {
    total: number;
    active: number;
    connections: Array<{
      id: string;
      componentId: string;
      age: number;
      isActive: boolean;
    }>;
  } {
    const now = Date.now();
    const connections = Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      componentId: conn.componentId,
      age: now - conn.createdAt,
      isActive: conn.isActive
    }));

    return {
      total: this.connections.size,
      active: connections.filter(c => c.isActive).length,
      connections
    };
  }

  /**
   * Initialize cleanup handlers for page unload
   */
  private initializeCleanupHandlers(): void {
    // Browser page unload
    window.addEventListener('beforeunload', () => {
      console.log('[HumeConnectionManager] Page unloading, cleaning up connections...');
      // Synchronous cleanup for page unload
      this.connections.forEach(conn => {
        try {
          conn.service.disconnect();
        } catch (e) {
          // Ignore errors during emergency cleanup
        }
      });
    });

    // React navigation cleanup
    window.addEventListener('popstate', () => {
      this.cleanupStaleConnections();
    });

    // Visibility change cleanup
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        setTimeout(() => this.cleanupStaleConnections(), 1000);
      }
    });
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      if (!this.isShuttingDown) {
        this.cleanupStaleConnections();
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Shutdown the manager
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    await this.emergencyCleanupAll();
  }
}

// Global singleton instance
export const humeConnectionManager = new HumeConnectionManager();

// Emergency cleanup function for console debugging
(window as any).emergencyCleanupHume = () => {
  humeConnectionManager.emergencyCleanupAll();
};

// Connection status function for debugging
(window as any).humeConnectionStatus = () => {
  console.log('Hume Connection Status:', humeConnectionManager.getConnectionStatus());
};

export default humeConnectionManager;
