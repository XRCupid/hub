// HumeAIService.js - Service to handle WebSocket connections with Hume AI API
import { webSocketManager } from './WebSocketManager';

class HumeAIService {
  constructor() {
    this.apiKey = 'm3KaINwHsH55rJNO6zr2kIEAWvOimYeLTon3OriOXWJeCxCl'; // HARDCODED
    this.secretKey = 'IWtKuDbybQZLI0qWWPJn2M1iW3wrKGiQhmoQcTvIGJD2iBhDG3eRD35969FzcjNT'; // HARDCODED
    this.baseURL = "https://api.hume.ai/v0";

    this.facialSocket = null;
    this.prosodySocket = null;
    this.onFacialUpdate = null;
    this.onProsodyUpdate = null;
    this.emotionCallback = null;
    this.unsubscribeFacial = null;
    this.unsubscribeProsody = null;
  }

  // Compatibility method for existing code
  onEmotionDetected(callback) {
    this.emotionCallback = callback;
    this.connectFacial((data) => {
      if (data.predictions && data.predictions.length > 0) {
        const topEmotion = data.predictions[0].emotions.sort((a, b) => b.score - a.score)[0];
        if (this.emotionCallback) {
          this.emotionCallback(topEmotion.name || 'neutral');
        }
      }
    });
  }

  // Connect to Hume for facial expressions
  connectFacial(onFacialUpdate) {
    this.onFacialUpdate = onFacialUpdate;
    
    // Clean up any existing subscription
    if (this.unsubscribeFacial) {
      this.unsubscribeFacial();
      this.unsubscribeFacial = null;
    }

    const url = `${this.baseURL}/stream/models?apiKey=${this.apiKey}`;
    const connectionKey = `facial:${url}`;
    
    // Get or create WebSocket connection
    this.facialSocket = webSocketManager.getConnection(url, 'facial');
    
    // Subscribe to WebSocket events
    this.unsubscribeFacial = webSocketManager.subscribe(connectionKey, (event) => {
      switch (event.type) {
        case 'open':
          console.log('Connected to Hume AI facial expressions WebSocket');
          break;
          
        case 'message':
          try {
            const data = JSON.parse(event.data);
            if (this.onFacialUpdate) {
              this.onFacialUpdate(data);
            }
          } catch (error) {
            console.error('Error processing facial expression data:', error);
          }
          break;
          
        case 'error':
          console.error('Facial WebSocket error:', event.error);
          break;
          
        case 'close':
          console.log('Facial WebSocket connection closed:', event.reason || 'Unknown reason');
          break;
          
        case 'reconnect_failed':
          console.error('Facial WebSocket reconnection failed after', event.attempts, 'attempts');
          break;
      }
    });

    return this.facialSocket;
  }

  // Connect to Hume for voice (prosody)
  connectProsody(onProsodyUpdate) {
    this.onProsodyUpdate = onProsodyUpdate;
    
    // Clean up any existing subscription
    if (this.unsubscribeProsody) {
      this.unsubscribeProsody();
      this.unsubscribeProsody = null;
    }

    const url = `${this.baseURL}/stream/models?apiKey=${this.apiKey}`;
    const connectionKey = `prosody:${url}`;
    
    // Get or create WebSocket connection
    this.prosodySocket = webSocketManager.getConnection(url, 'prosody');
    
    // Subscribe to WebSocket events
    this.unsubscribeProsody = webSocketManager.subscribe(connectionKey, (event) => {
      switch (event.type) {
        case 'open':
          console.log('Connected to Hume AI prosody WebSocket');
          break;
          
        case 'message':
          try {
            const data = JSON.parse(event.data);
            if (this.onProsodyUpdate) {
              this.onProsodyUpdate(data);
            }
          } catch (error) {
            console.error('Error processing prosody data:', error);
          }
          break;
          
        case 'error':
          console.error('Prosody WebSocket error:', event.error);
          break;
          
        case 'close':
          console.log('Prosody WebSocket connection closed:', event.reason || 'Unknown reason');
          break;
          
        case 'reconnect_failed':
          console.error('Prosody WebSocket reconnection failed after', event.attempts, 'attempts');
          break;
      }
    });

    return this.prosodySocket;
  }
  
    // Disconnect all WebSocket connections
    disconnect() {
      // Unsubscribe from WebSocket events
      if (this.unsubscribeFacial) {
        this.unsubscribeFacial();
        this.unsubscribeFacial = null;
      }
      if (this.unsubscribeProsody) {
        this.unsubscribeProsody();
        this.unsubscribeProsody = null;
      }
      
      // Close WebSocket connections
      if (this.facialSocket) {
        webSocketManager.closeConnection(`facial:${this.facialSocket.url}`, 1000, 'User disconnected');
        this.facialSocket = null;
      }
      if (this.prosodySocket) {
        webSocketManager.closeConnection(`prosody:${this.prosodySocket.url}`, 1000, 'User disconnected');
        this.prosodySocket = null;
      }
      
      this.onFacialUpdate = null;
      this.onProsodyUpdate = null;
    }
  
    // Send captured image data for facial expression analysis
    sendImageForAnalysis(imageData) {
      if (!this.facialSocket || this.facialSocket.readyState !== WebSocket.OPEN) {
        console.error('Facial WebSocket not connected');
        return;
      }
  
      // If the string is a data URL, strip off "data:...base64,"
      if (typeof imageData === 'string') {
        let base64String = imageData;
        if (imageData.startsWith('data:')) {
          base64String = imageData.split(',')[1];
        }
        // Add actual WebSocket message sending logic here
      }
    }
}

export default HumeAIService;
