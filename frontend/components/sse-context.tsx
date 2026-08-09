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
  data: SSENotificationPayload;
}

interface SSENotificationPayload {
  transaction_payload?: SSENotificationTransactionUpdatePayload;
  content_payload?: SSENotificationContentUpdatePayload;
}

interface SSENotificationTransactionUpdatePayload {
  client_transaction_id: string;
  transaction_status: "cancelled" | "failed" | "pending" | "successful";
}

interface SSENotificationContentUpdatePayload {
  type: "users" | "items" | "settings";
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
  const reconnectDelay = 2500; // 2.5 seconds

  const connect = () => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    if (!hasEverConnected.current) {
      setConnectionStatus("connecting");
      console.log("Establishing SSE connection to payment events...");
    }

    try {
      const eventSource = new EventSource(
        `${config.apiBaseUrl}/api/payment/v1/events`
      );

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connection established");
        setIsConnected(true);
        setConnectionStatus("connected");
        hasEverConnected.current = true;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("SSE event received:", data);

          const eventType = data.type || "message";
          const eventData = data.data || data;

          setLastEvent({
            type: eventType,
            data: eventData,
          });

          // Handle different event types and dispatch custom events
          if (eventType === "content_update") {
            console.log("Content update received:", data);
            if (eventData.content_payload?.type === "settings") {
              window.dispatchEvent(new CustomEvent("sse:settings"));
            }
          } else if (eventType === "transaction_update") {
            console.log("Transaction update received:", data);
          }
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

        const status = hasEverConnected.current ? "reconnecting" : "error";
        setConnectionStatus(status);

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      };
    } catch (error) {
      console.error("Failed to create SSE connection:", error);
      setConnectionStatus("error");
    }
  };

  const disconnect = () => {
    console.log("Closing SSE connection...");

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
  };

  useEffect(() => {
    connect();

    const handleBeforeUnload = () => {
      disconnect();
    };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
