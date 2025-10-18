"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";
import { useUser, User } from "@/components/user-context";

interface AuthContextType {
  loggedIn: boolean;
  expiresIn: number | null;
  login: (
    username: string,
    password?: string,
    redirect?: boolean
  ) => Promise<User | null>;
  logout: (redirect?: boolean) => void;
  enableAutoRefresh: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const router = useRouter();
  const { setUser } = useUser();

  // countdown logic
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;

    async function refresh() {
      try {
        const res = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to refresh session");
        }
        const data = await res.json();
        if (data.expire) {
          const expTime = new Date(data.expire).getTime().toString();
          localStorage.setItem("session_exp", expTime);
          setLoggedIn(true);
        } else {
          throw new Error("No expiry time in refresh response");
        }
      } catch (error) {
        console.error("Session refresh failed:", error);
        setLoggedIn(false);
        setUser(null);
        localStorage.removeItem("session_exp");
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
          refreshTimeout = null;
        }
        router.push("/");
      }
    }

    function updateCountdown() {
      const exp = localStorage.getItem("session_exp");
      if (exp) {
        const expTime = parseInt(exp, 10);
        const now = Date.now();
        const diff = Math.max(0, Math.floor((expTime - now) / 1000));
        setExpiresIn(diff);

        if (diff <= 0) {
          setLoggedIn(false);
          setUser(null);
          localStorage.removeItem("session_exp");
          if (refreshTimeout) {
            clearTimeout(refreshTimeout);
            refreshTimeout = null;
          }
          router.push("/");
        } else {
          setLoggedIn(document.cookie.includes("drinks_pos_session="));

          if (autoRefreshEnabled && diff > 60 && refreshTimeout === null) {
            refreshTimeout = setTimeout(() => {
              refresh();
              refreshTimeout = null;
            }, (diff - 60) * 1000);
          }
        }
      } else {
        setExpiresIn(null);
        setLoggedIn(false);
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
          refreshTimeout = null;
        }
      }
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => {
      clearInterval(interval);
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefreshEnabled]);

  const login = async (
    username: string,
    password?: string,
    redirect: boolean = true
  ): Promise<User | null> => {
    try {
      const res = await fetch(`${config.apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data.message || "Login failed");
        error.name = res.status === 401 ? "Unauthorized" : "LoginError";
        throw error;
      }

      if (data.expire) {
        const expTime = new Date(data.expire).getTime().toString();
        localStorage.setItem("session_exp", expTime);
        setLoggedIn(true);

        if (data.user) {
          setUser(data.user);
        }

        if (redirect) {
          router.push("/items");
        }

        return data.user || null;
      } else {
        throw new Error("No expiry time received from server");
      }
    } catch (error) {
      setLoggedIn(false);
      setUser(null);
      localStorage.removeItem("session_exp");
      throw error;
    }
  };

  const logout = async (redirect: boolean = true) => {
    await fetch(`${config.apiBaseUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    document.cookie =
      "drinks_pos_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("session_exp");
    setLoggedIn(false);
    setUser(null);

    if (redirect) {
      router.push("/");
    }
  };

  const enableAutoRefresh = (enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
  };

  return (
    <AuthContext.Provider
      value={{ loggedIn, expiresIn, login, logout, enableAutoRefresh }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
