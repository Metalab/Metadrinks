"use client";

import { useEffect, useCallback } from "react";
import { useSSE } from "@/components/sse-context";

interface SSEEvent {
  type: string;
  data: any;
}

type EventHandler = (event: SSEEvent) => void;

/**
 * Custom hook to listen for specific SSE event types
 * @param eventType - The type of event to listen for (e.g., 'transaction_update', 'content_update')
 * @param handler - Callback function to handle the event
 * @param deps - Dependencies array for the handler callback
 */
export const useSSEEvent = (
  eventType: string | string[], 
  handler: EventHandler,
  deps: any[] = []
) => {
  const { lastEvent } = useSSE();

  // Memoize the handler to prevent unnecessary re-renders
  const memoizedHandler = useCallback(handler, deps);

  useEffect(() => {
    if (!lastEvent) return;

    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];
    
    if (eventTypes.includes(lastEvent.type)) {
      memoizedHandler(lastEvent);
    }
  }, [lastEvent, memoizedHandler, eventType]);
};

/**
 * Hook specifically for payment/transaction updates
 */
export const useTransactionUpdates = (handler: (data: any) => void, deps: any[] = []) => {
  useSSEEvent('transaction_update', (event) => {
    handler(event.data);
  }, deps);
};

/**
 * Hook specifically for content updates
 */
export const useContentUpdates = (handler: (data: any) => void, deps: any[] = []) => {
  useSSEEvent('content_update', (event) => {
    handler(event.data);
  }, deps);
};

/**
 * Hook to get the current SSE connection status
 */
export const useSSEStatus = () => {
  const { isConnected, connectionStatus } = useSSE();
  return { isConnected, connectionStatus };
};