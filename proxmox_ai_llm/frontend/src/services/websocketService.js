// proxmox_ai_llm/frontend/src/services/websocketService.js
export class WorkflowSocket {
    constructor(workflowId, onMessage) {
      this.workflowId = workflowId;
      this.onMessage = onMessage;
      this.socket = null;
      this.pingInterval = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 10; // Increased from 5
      this.connectingInProgress = false;
      this.connectionLostTimestamp = null;
      this.intentionalDisconnect = false;
    }
  
    connect() {
      // Prevent multiple connection attempts simultaneously
      if (this.connectingInProgress) {
        console.log("Connection attempt already in progress, skipping");
        return;
      }
  
      // If intentionally disconnected, don't reconnect
      if (this.intentionalDisconnect) {
        console.log("WebSocket was intentionally disconnected, not reconnecting.");
        return;
      }
  
      // Clean up existing connection if any
      if (this.socket) {
        this.disconnect(false); // Call disconnect but don't mark as intentional
      }
  
      this.connectingInProgress = true;
  
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
        console.log(`Attempting WebSocket connection to ${protocol}//${host}/ws/workflow/${this.workflowId} (Attempt: ${this.reconnectAttempts + 1})`);
        
        this.socket = new WebSocket(`${protocol}//${host}/ws/workflow/${this.workflowId}`);
        
        this.socket.onopen = () => {
          console.log(`WebSocket connected for workflow ${this.workflowId}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectingInProgress = false;
          this.connectionLostTimestamp = null;
          
          // Send ping every 15 seconds to keep connection alive (reduced from 30)
          this.pingInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
              try {
                this.socket.send('ping');
                console.debug("Ping sent to keep connection alive");
              } catch (error) {
                console.error("Error sending ping:", error);
                // If we can't send a ping, the connection might be dead
                clearInterval(this.pingInterval);
                this.pingInterval = null;
                if (this.socket) {
                  this.socket.close();
                }
              }
            }
          }, 15000);
        };
        
        this.socket.onmessage = (event) => {
          try {
            // Skip processing the "pong" response
            if (event.data === "pong") {
              console.debug("Received pong from server");
              return;
            }
            
            const data = JSON.parse(event.data);
            // Only process if we have a valid callback
            if (typeof this.onMessage === 'function') {
              this.onMessage(data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error, 'Raw data:', event.data);
          }
        };
        
        this.socket.onclose = (event) => {
          const wasConnected = this.isConnected;
          this.isConnected = false;
          this.connectingInProgress = false;
          
          // Clean up ping interval
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
          }
          
          // Check if this was intentional
          if (this.intentionalDisconnect) {
            console.log(`WebSocket intentionally disconnected for workflow ${this.workflowId}`);
            return;
          }
          
          // Log the disconnect with code information
          console.log(`WebSocket disconnected for workflow ${this.workflowId}:`, 
                      `Code: ${event.code}`, 
                      `Reason: ${event.reason || 'No reason provided'}`, 
                      `Clean: ${event.wasClean}`);
          
          // Store timestamp of disconnection if we were previously connected
          if (wasConnected && !this.connectionLostTimestamp) {
            this.connectionLostTimestamp = Date.now();
          }
          
          // Only attempt to reconnect if not closed intentionally
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            
            // Use exponential backoff with a maximum delay of 30 seconds
            const baseDelay = 1000; // Start with 1 second
            const maxDelay = 30000; // Max 30 seconds
            const delay = Math.min(baseDelay * Math.pow(1.5, this.reconnectAttempts - 1), maxDelay);
            
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
            
            // Set a timeout to reconnect
            setTimeout(() => this.connect(), delay);
          } else {
            console.error(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached.`);
            
            // Calculate total time trying to reconnect
            if (this.connectionLostTimestamp) {
              const totalTime = (Date.now() - this.connectionLostTimestamp) / 1000;
              console.error(`Connection has been unavailable for ${totalTime.toFixed(1)} seconds.`);
            }
            
            // Try one final time after a longer delay (120 seconds)
            console.log("Will attempt one final reconnection in 2 minutes...");
            setTimeout(() => {
              this.reconnectAttempts = 0;
              this.connect();
            }, 120000);
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectingInProgress = false;
          
          // The onclose handler will be called after an error, so reconnection logic is there
        };
      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
        this.connectingInProgress = false;
        
        // Schedule a retry for unexpected errors
        setTimeout(() => {
          this.connect();
        }, 5000);
      }
    }
  
    disconnect(intentional = true) {
      this.intentionalDisconnect = intentional;
      
      if (this.socket) {
        // Only close if the socket is not already closing or closed
        if (this.socket.readyState !== WebSocket.CLOSING && this.socket.readyState !== WebSocket.CLOSED) {
          try {
            this.socket.close(1000, intentional ? "User initiated disconnect" : "Reconnecting");
          } catch (error) {
            console.error("Error closing WebSocket:", error);
          }
        }
        this.socket = null;
      }
      
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
      
      this.isConnected = false;
      
      // Only reset reconnect attempts if this is an intentional disconnect
      if (intentional) {
        this.reconnectAttempts = 0;
        console.log(`Intentionally disconnected WebSocket for workflow ${this.workflowId}`);
      }
    }
    
    // Add a method to check if the connection is healthy
    isConnectionHealthy() {
      return this.isConnected && 
             this.socket && 
             this.socket.readyState === WebSocket.OPEN;
    }
    
    // Add a method to force reconnection
    forceReconnect() {
      console.log("Forcing WebSocket reconnection");
      this.intentionalDisconnect = false;
      this.reconnectAttempts = 0;
      this.disconnect(false);
      this.connect();
    }
  }