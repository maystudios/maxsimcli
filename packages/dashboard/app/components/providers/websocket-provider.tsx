"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface WSContextValue {
  connected: boolean;
  lastChange: number;
}

const WSContext = createContext<WSContextValue>({
  connected: false,
  lastChange: 0,
});

const INITIAL_RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 30000;
const RECONNECT_MULTIPLIER = 1.5;

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [lastChange, setLastChange] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);

  useEffect(() => {
    function connect() {
      // Determine ws:// or wss:// based on page protocol
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        // Reset reconnect delay on successful connection
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;

        // Schedule reconnect with exponential backoff
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(
          delay * RECONNECT_MULTIPLIER,
          MAX_RECONNECT_DELAY
        );

        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === "file-changes" && typeof data.timestamp === "number") {
            setLastChange(data.timestamp);
          }
        } catch {
          // Ignore unparseable messages
        }
      };

      ws.onerror = () => {
        // Log but don't crash — onclose will handle reconnection
        console.warn("[ws-provider] WebSocket error occurred");
      };
    }

    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return (
    <WSContext.Provider value={{ connected, lastChange }}>
      {children}
    </WSContext.Provider>
  );
}

/**
 * Hook to access WebSocket connection state and last file change timestamp.
 *
 * `connected` — whether the WebSocket is currently open.
 * `lastChange` — epoch timestamp of the most recent file-changes event (0 if none).
 */
export function useWebSocket(): WSContextValue {
  return useContext(WSContext);
}
