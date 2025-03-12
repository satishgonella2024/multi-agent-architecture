// proxmox_ai_llm/frontend/src/services/websocketService.js
export class WorkflowSocket {
    constructor(workflowId, onMessage) {
      this.workflowId = workflowId;
      this.onMessage = onMessage;
      this.socket = null;
      this.pingInterval = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 10;
      this.connectingInProgress = false;
      this.connectionLostTimestamp = null;
      this.intentionalDisconnect = false;
      this.currentPongTimeout = null;
      this.backoffDelay = 1000; // Start with 1 second
      this.maxBackoffDelay = 30000; // Max 30 seconds
      this.connectionId = Math.random().toString(36).substring(7);
      this.pendingTimeouts = new Set();
      this.isDestroyed = false;
    }
  
    clearAllTimeouts() {
      for (const timeout of this.pendingTimeouts) {
        clearTimeout(timeout);
      }
      this.pendingTimeouts.clear();
    }
  
    setTimeout(callback, delay) {
      if (this.isDestroyed) return null;
      const timeoutId = setTimeout(() => {
        this.pendingTimeouts.delete(timeoutId);
        if (!this.isDestroyed) {
          callback();
        }
      }, delay);
      this.pendingTimeouts.add(timeoutId);
      return timeoutId;
    }
  
    connect() {
      if (this.isDestroyed) {
        console.log(`[${this.connectionId}] Instance is destroyed, not connecting`);
        return;
      }
  
      if (this.connectingInProgress) {
        console.log(`[${this.connectionId}] Connection attempt already in progress, skipping`);
        return;
      }
  
      if (this.intentionalDisconnect) {
        console.log(`[${this.connectionId}] WebSocket was intentionally disconnected, not reconnecting.`);
        return;
      }
  
      if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
        console.log(`[${this.connectionId}] Socket still exists and not closed, disconnecting first`);
        this.disconnect(false);
      }
  
      this.connectingInProgress = true;
  
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.DEV ? '192.168.5.199:8082' : window.location.host;
        const url = `${protocol}//${host}/ws/workflow/${this.workflowId}`;
        
        console.log(`[${this.connectionId}] Attempting WebSocket connection to ${url} (Attempt: ${this.reconnectAttempts + 1})`);
        
        if (this.socket) {
          console.log(`[${this.connectionId}] Cleaning up existing socket`);
          this.cleanupSocket();
        }

        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
          if (this.isDestroyed) {
            this.disconnect(true);
            return;
          }

          console.log(`[${this.connectionId}] WebSocket connected for workflow ${this.workflowId}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectingInProgress = false;
          this.connectionLostTimestamp = null;
          this.backoffDelay = 1000; // Reset backoff delay on successful connection
          
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
          }
          
          this.pingInterval = setInterval(() => {
            if (this.isDestroyed) {
              clearInterval(this.pingInterval);
              return;
            }

            if (this.isConnectionHealthy()) {
              try {
                this.socket.send('ping');
                console.debug(`[${this.connectionId}] Ping sent`);
                
                if (this.currentPongTimeout) {
                  clearTimeout(this.currentPongTimeout);
                }
                
                this.currentPongTimeout = this.setTimeout(() => {
                  console.warn(`[${this.connectionId}] No pong received within 5 seconds`);
                  this.forceReconnect();
                }, 5000);
              } catch (error) {
                console.error(`[${this.connectionId}] Error sending ping:`, error);
                this.forceReconnect();
              }
            } else {
              console.warn(`[${this.connectionId}] Connection unhealthy, forcing reconnect`);
              this.forceReconnect();
            }
          }, 30000);
        };
        
        this.socket.onmessage = (event) => {
          if (this.isDestroyed) return;

          try {
            if (event.data === "ping") {
              console.debug(`[${this.connectionId}] Received ping from server`);
              if (this.isConnectionHealthy()) {
                this.socket.send("pong");
              }
              return;
            }
            
            if (event.data === "pong") {
              console.debug(`[${this.connectionId}] Received pong from server`);
              if (this.currentPongTimeout) {
                clearTimeout(this.currentPongTimeout);
                this.currentPongTimeout = null;
              }
              return;
            }
            
            const data = JSON.parse(event.data);
            if (typeof this.onMessage === 'function' && this.isConnectionHealthy() && !this.isDestroyed) {
              this.onMessage(data);
            }
          } catch (error) {
            console.error(`[${this.connectionId}] Error handling WebSocket message:`, error, 'Raw data:', event.data);
          }
        };
        
        this.socket.onclose = (event) => {
          if (this.isDestroyed) return;

          const wasConnected = this.isConnected;
          this.isConnected = false;
          this.connectingInProgress = false;
          
          this.cleanupTimers();
          
          if (this.intentionalDisconnect || this.isDestroyed) {
            console.log(`[${this.connectionId}] WebSocket intentionally disconnected for workflow ${this.workflowId}`);
            return;
          }
          
          console.log(`[${this.connectionId}] WebSocket disconnected:`, 
                      `Code: ${event.code}`, 
                      `Reason: ${event.reason || 'No reason provided'}`, 
                      `Clean: ${event.wasClean}`);
          
          if (wasConnected && !this.connectionLostTimestamp) {
            this.connectionLostTimestamp = Date.now();
          }
          
          if (!this.intentionalDisconnect && !this.isDestroyed && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            
            this.backoffDelay = Math.min(
              this.backoffDelay * 1.5,
              this.maxBackoffDelay
            );
            
            console.log(`[${this.connectionId}] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.backoffDelay}ms...`);
            
            this.setTimeout(() => {
              if (!this.isDestroyed && !this.intentionalDisconnect) {
                this.connect();
              }
            }, this.backoffDelay);
          } else if (!this.intentionalDisconnect && !this.isDestroyed) {
            console.error(`[${this.connectionId}] Maximum reconnection attempts reached.`);
            
            if (this.connectionLostTimestamp) {
              const totalTime = (Date.now() - this.connectionLostTimestamp) / 1000;
              console.error(`[${this.connectionId}] Connection unavailable for ${totalTime.toFixed(1)} seconds.`);
            }
            
            console.log(`[${this.connectionId}] Scheduling final reconnection attempt in 2 minutes...`);
            this.setTimeout(() => {
              if (!this.isDestroyed && !this.intentionalDisconnect) {
                this.reconnectAttempts = 0;
                this.backoffDelay = 1000;
                this.connect();
              }
            }, 120000);
          }
        };
        
        this.socket.onerror = (error) => {
          if (!this.isDestroyed) {
            console.error(`[${this.connectionId}] WebSocket error:`, error);
          }
          this.connectingInProgress = false;
        };
      } catch (error) {
        console.error(`[${this.connectionId}] Error establishing WebSocket connection:`, error);
        this.connectingInProgress = false;
        
        if (!this.isDestroyed && !this.intentionalDisconnect) {
          this.setTimeout(() => this.connect(), this.backoffDelay);
        }
      }
    }
  
    cleanupSocket() {
      if (this.socket) {
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.onmessage = null;
        this.socket.onopen = null;
        this.socket = null;
      }
    }
  
    cleanupTimers() {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
      
      if (this.currentPongTimeout) {
        clearTimeout(this.currentPongTimeout);
        this.currentPongTimeout = null;
      }

      this.clearAllTimeouts();
    }
  
    disconnect(intentional = true) {
      console.log(`[${this.connectionId}] Disconnecting WebSocket (intentional: ${intentional})`);
      this.intentionalDisconnect = intentional;
      this.isDestroyed = intentional;
      
      if (this.socket) {
        if (this.socket.readyState !== WebSocket.CLOSING && this.socket.readyState !== WebSocket.CLOSED) {
          try {
            this.socket.close(1000, intentional ? "User initiated disconnect" : "Reconnecting");
          } catch (error) {
            console.error(`[${this.connectionId}] Error closing WebSocket:`, error);
          }
        }
        this.cleanupSocket();
      }
      
      this.cleanupTimers();
      this.isConnected = false;
      
      if (intentional) {
        this.reconnectAttempts = 0;
        this.backoffDelay = 1000;
        console.log(`[${this.connectionId}] Intentionally disconnected WebSocket for workflow ${this.workflowId}`);
      }
    }
    
    isConnectionHealthy() {
      return !this.isDestroyed && 
             this.isConnected && 
             this.socket && 
             this.socket.readyState === WebSocket.OPEN;
    }
    
    forceReconnect() {
      if (this.isDestroyed) return;

      console.log(`[${this.connectionId}] Forcing WebSocket reconnection`);
      this.intentionalDisconnect = false;
      this.reconnectAttempts = 0;
      this.backoffDelay = 1000;
      this.disconnect(false);
      this.connect();
    }
  }