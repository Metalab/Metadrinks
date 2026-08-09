"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";
import { useUser, User } from "@/components/user-context";

function decodeJWT(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
    return decoded;
  } catch {
    return null;
  }
}

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "drinks_pos_session") {
      return decodeURIComponent(value);
    }
  }
  return null;
}

interface AuthContextType {
  loggedIn: boolean;
  isInitialized: boolean;
  expiresIn: number | null;
  login: (
    username: string,
    password?: string,
    redirect?: boolean,
    login_barcode?: string,
  ) => Promise<User | null>;
  logout: (redirect?: boolean) => void;
  enableAutoRefresh: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const router = useRouter();
  const { setUser } = useUser();

  // restore auth state from localStoage
  useEffect(() => {
    const exp = localStorage.getItem("session_exp");
    if (exp) {
      const expTime = parseInt(exp, 10);
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expTime - now) / 1000));

      if (diff > 0) {
        setLoggedIn(true);

        const token = getTokenFromCookie();
        if (token) {
          const decoded = decodeJWT(token);
          if (decoded) {
            const userData: User = {
              id: decoded.userId || "",
              name: decoded.sub || "",
              balance: 0,
              is_active: true,
              is_trusted: decoded.trusted || false,
              is_restricted: decoded.restricted || false,
              is_admin: decoded.admin || false,
            };
            setUser(userData);
          }
        }
      } else {
        localStorage.removeItem("session_exp");
        setLoggedIn(false);
      }
    } else {
      setLoggedIn(false);
    }
    setIsInitialized(true);
  }, []);

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
          setLoggedIn(true);

          if (autoRefreshEnabled && diff > 60 && refreshTimeout === null) {
            refreshTimeout = setTimeout(
              () => {
                refresh();
                refreshTimeout = null;
              },
              (diff - 60) * 1000,
            );
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
    redirect: boolean = true,
    login_barcode?: string,
  ): Promise<User | null> => {
    try {
      const body: {
        username?: string;
        password?: string;
        barcode?: string;
      } = {};

      if (login_barcode) {
        body.barcode = login_barcode;
      } else {
        body.username = username;
        if (password) {
          body.password = password;
        }
      }

      const res = await fetch(`${config.apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      value={{
        loggedIn,
        isInitialized,
        expiresIn,
        login,
        logout,
        enableAutoRefresh,
      }}
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
