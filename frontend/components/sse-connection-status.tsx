"use client";

import React from "react";
import { useSSE } from "@/components/sse-context";

export const SSEConnectionStatus = () => {
  const { connectionStatus } = useSSE();

  return (
    <div className="fixed bottom-4 right-4 p-3 bg-background border rounded-lg shadow-lg text-xs max-w-sm">
      <div className="flex items-center justify-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            connectionStatus === "connected"
              ? "bg-green-500"
              : connectionStatus === "connecting"
              ? "bg-yellow-500"
              : connectionStatus === "reconnecting"
              ? "bg-yellow-500"
              : connectionStatus === "error"
              ? "bg-red-500"
              : "bg-gray-500"
          }`}
        />
        <span className="font-medium">SSE: {connectionStatus}</span>
      </div>
    </div>
  );
};

export default SSEConnectionStatus;
