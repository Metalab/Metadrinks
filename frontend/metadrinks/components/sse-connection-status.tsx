"use client";

import React from "react";
import { useSSE } from "@/components/sse-context";

export const SSEConnectionStatus = () => {
  const { isConnected, connectionStatus, lastEvent } = useSSE();

  return (
    <div className="fixed bottom-4 right-4 p-3 bg-background border rounded-lg shadow-lg text-xs max-w-sm">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-2 h-2 rounded-full ${
            connectionStatus === "connected"
              ? "bg-green-500"
              : connectionStatus === "connecting"
              ? "bg-yellow-500"
              : connectionStatus === "error"
              ? "bg-red-500"
              : "bg-gray-500"
          }`}
        />
        <span className="font-medium">SSE: {connectionStatus}</span>
      </div>

      {lastEvent && (
        <div className="text-muted-foreground">
          <div>Last event: {lastEvent.type}</div>
          <div className="text-xs mt-1 truncate">
            {JSON.stringify(lastEvent.data)}
          </div>
        </div>
      )}
    </div>
  );
};

export default SSEConnectionStatus;
