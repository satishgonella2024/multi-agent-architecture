import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebSocketResult {
  lastMessage: string | null;
  isConnected: boolean;
  error: string | null;
  sendMessage: (message: string) => void;
}

export function useWebSocket(path: string | null): UseWebSocketResult {
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const reconnectAttemptsRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 3;

  const connect = useCallback(() => {
    // Clean up any existing connection first
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Don't attempt to connect if path is null
    if (!path) {
      setIsConnected(false);
      setError(null);
      return;
    }

    // If we've exceeded the maximum reconnect attempts, stop trying
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setError(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts. Backend may be unavailable.`);
      return;
    }

    try {
      // For development, we need to handle the case where the frontend is served from a different port
      // than the backend. In production, they would typically be on the same host.
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Use the backend URL from environment if available, otherwise use the current host
      const host = process.env.REACT_APP_API_URL 
        ? new URL(process.env.REACT_APP_API_URL).host 
        : window.location.host;
      
      // If we're in development and the ports are different, use the backend port (8000)
      const wsUrl = `${protocol}//${host === window.location.host ? host : '192.168.5.199:8000'}${path}`;
      
      console.log(`Attempting to connect to WebSocket at ${wsUrl}`);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        console.log('WebSocket connection established');
      };

      wsRef.current.onmessage = (event) => {
        setLastMessage(event.data);
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        console.log(`WebSocket connection closed with code ${event.code}`);
        
        // Only attempt to reconnect if we still have a path and haven't exceeded max attempts
        if (path && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000); // Exponential backoff with max of 10 seconds
          
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);
          
          // Attempt to reconnect with exponential backoff
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setError(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts. Backend may be unavailable.`);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket error occurred. The backend may be unavailable.');
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to WebSocket');
      console.error('WebSocket connection error:', err);
      
      // Still attempt to reconnect on error if we haven't exceeded max attempts
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, delay);
      }
    }
  }, [path]);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    // Reset reconnect attempts when the path changes
    reconnectAttemptsRef.current = 0;
    
    // Only connect if we have a path
    if (path) {
      connect();
    } else {
      // Clean up any existing connection if path becomes null
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      setLastMessage(null);
      setError(null);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, path]);

  return {
    lastMessage,
    isConnected,
    error,
    sendMessage
  };
} 