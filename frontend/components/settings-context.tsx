"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { env } from "next-runtime-env";
import { config } from "@/lib/config";
import { Settings } from "@/types/settings";

interface SettingsContextType {
  settings: Settings | null;
  maintenanceMode: boolean;
  isEnvMaintenance: boolean;
  refreshSettings: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Check if maintenance mode is forced via environment variable
  const isEnvMaintenance = env("NEXT_PUBLIC_MAINTENANCE") === "true";

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/v1/settings`);

      if (res.ok) {
        const data = await res.json();
        const fetchedSettings = data.data || data;
        setSettings(fetchedSettings);
      } else {
        console.error("Failed to fetch settings:", res.status);
        // Fallback to default settings
        setSettings({ maintenance: false });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Fallback to default settings
      setSettings({ maintenance: false });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, []);

  // Subscribe to SSE settings updates
  useEffect(() => {
    const handleSettingsUpdate = async () => {
      console.log("Settings updated via SSE, fetching latest settings...");
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/v1/settings`);

        if (res.ok) {
          const data = await res.json();
          const fetchedSettings = data.data || data;
          setSettings(fetchedSettings);
        } else {
          console.error(
            "Failed to fetch settings after SSE update:",
            res.status
          );
        }
      } catch (error) {
        console.error("Error fetching settings after SSE update:", error);
      }
    };

    // Listen for settings update events
    window.addEventListener("sse:settings", handleSettingsUpdate);

    return () => {
      window.removeEventListener("sse:settings", handleSettingsUpdate);
    };
  }, []);

  // Determine maintenance mode: environment variable takes precedence
  const maintenanceMode = isEnvMaintenance || settings?.maintenance || false;

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        maintenanceMode,
        isEnvMaintenance,
        refreshSettings,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
