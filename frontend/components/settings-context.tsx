"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { env } from "next-runtime-env";
import { config } from "@/lib/config";
import { Settings } from "@/types/settings";
import { useUser } from "@/components/user-context";

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
  const isEnvMaintenance = env("NEXT_PUBLIC_MAINTENANCE") === "true";

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const hasFetchedRef = useRef(false);
  const lastAdminStatusRef = useRef<boolean | undefined>(undefined);

  const fetchSettings = useCallback(async () => {
    try {
      const endpoint = user?.is_admin
        ? `${config.apiBaseUrl}/api/admin/v1/settings`
        : `${config.apiBaseUrl}/api/v1/settings`;

      console.log(
        `Fetching settings from: ${endpoint} (is_admin: ${user?.is_admin})`
      );

      const res = await fetch(endpoint, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        const fetchedSettings = data.data || data;
        setSettings(fetchedSettings);
      } else {
        console.error("Failed to fetch settings:", res.status);
        setSettings({ maintenance: false });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setSettings({ maintenance: false });
    } finally {
      setLoading(false);
    }
  }, [user?.is_admin]);

  useEffect(() => {
    const isAdmin = user?.is_admin;

    // fetch if:
    // - never fetched before, OR
    // - admin status has changed
    if (!hasFetchedRef.current || lastAdminStatusRef.current !== isAdmin) {
      hasFetchedRef.current = true;
      lastAdminStatusRef.current = isAdmin;
      fetchSettings();
    }
  }, [user?.is_admin, fetchSettings]);

  useEffect(() => {
    const handleSettingsUpdate = async () => {
      console.log("Settings updated via SSE, fetching latest settings...");
      try {
        const endpoint = user?.is_admin
          ? `${config.apiBaseUrl}/api/admin/v1/settings`
          : `${config.apiBaseUrl}/api/v1/settings`;

        console.log(
          `Fetching settings via SSE from: ${endpoint} (is_admin: ${user?.is_admin})`
        );

        const res = await fetch(endpoint, {
          credentials: "include",
        });

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

    window.addEventListener("sse:settings", handleSettingsUpdate);

    return () => {
      window.removeEventListener("sse:settings", handleSettingsUpdate);
    };
  }, [user?.is_admin]);

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
