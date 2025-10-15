"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { config } from "@/lib/config";

interface SSEEvent {
  type: string;
  data: any;
}

interface SSEContextType {
  isConnected: boolean;
  lastEvent: SSEEvent | null;
  connectionStatus:
    | "connecting"
    | "connected"
    | "disconnected"
    | "error"
    | "reconnecting";
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

export const SSEProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error" | "reconnecting"
  >("disconnected");
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasEverConnected = useRef(false);
  const reconnectDelay = 5000; // 5 seconds

  const connect = () => {
    // Don't create a new connection if one already exists
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Only set to "connecting" on initial connection, not on reconnects
    if (!hasEverConnected.current) {
      setConnectionStatus("connecting");
      console.log("Establishing SSE connection to payment events...");
    }

    try {
      const eventSource = new EventSource(
        `${config.apiBaseUrl}/payment/v1/events`
      );

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connection established");
        setIsConnected(true);
        setConnectionStatus("connected");
        hasEverConnected.current = true; // Mark that we've successfully connected at least once
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("SSE event received:", data);
          setLastEvent({
            type: data.type || "message",
            data: data.data || data,
          });
        } catch (error) {
          console.error("Failed to parse SSE event data:", error);
          setLastEvent({
            type: "raw",
            data: event.data,
          });
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        setIsConnected(false);

        // Use "error" status only if we've never successfully connected (initial connection failure)
        // Use "reconnecting" status if we've connected before
        const status = hasEverConnected.current ? "reconnecting" : "error";
        setConnectionStatus(status);

        console.log(`SSE reconnection attempt in ${reconnectDelay}ms`);

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      };

      // Listen for specific event types if the server sends them
      eventSource.addEventListener("transaction_update", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Transaction update received:", data);
          setLastEvent({
            type: "transaction_update",
            data,
          });
        } catch (error) {
          console.error("Failed to parse transaction update:", error);
        }
      });

      eventSource.addEventListener("content_update", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Content update received:", data);
          setLastEvent({
            type: "content_update",
            data,
          });
        } catch (error) {
          console.error("Failed to parse content update:", error);
        }
      });
    } catch (error) {
      console.error("Failed to create SSE connection:", error);
      setConnectionStatus("error");
    }
  };

  const disconnect = () => {
    console.log("Closing SSE connection...");

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close the EventSource connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
  };

  // Establish connection when component mounts and clean up on unmount
  useEffect(() => {
    connect();

    // Cleanup function to close connection when component unmounts or page is closed
    const handleBeforeUnload = () => {
      disconnect();
    };

    // Handle page visibility changes to reconnect when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Page hidden, maintaining SSE connection");
      } else {
        console.log("Page visible, ensuring SSE connection");
        if (
          !eventSourceRef.current ||
          eventSourceRef.current.readyState === EventSource.CLOSED
        ) {
          connect();
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      disconnect();
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <SSEContext.Provider value={{ isConnected, lastEvent, connectionStatus }}>
      {children}
    </SSEContext.Provider>
  );
};

export const useSSE = () => {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error("useSSE must be used within an SSEProvider");
  }
  return context;
};
