"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { useAuth } from "@/components/auth-context";
import { useUser } from "@/components/user-context";

export function useLogin() {
  const [loading, setLoading] = useState<{ [id: string]: boolean }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogUsername, setDialogUsername] = useState("");

  const { login } = useAuth();
  const { setUser } = useUser();
  
  const handleLogin = async (username: string, userId?: string) => {
    if (userId) {
      setLoading((prev) => ({ ...prev, [userId]: true }));
    }

    try {
      await login(username);
      // attempt to fetch user info and set it in context
      try {
        // Prefer fetching the explicit user record when we have an id
        let info: any | undefined;
        if (userId) {
          const userRes = await fetch(
            `${config.apiBaseUrl}/api/v1/users/${userId}`,
            { method: "GET", credentials: "include" }
          );
          if (userRes.ok) {
            info = await userRes.json();
          }
        }

        if (info) {
          // normalize to our User shape when possible
          // coerce balance to number when possible
          let balance: number | undefined = undefined;
          if (typeof info.balance === "number") balance = info.balance;
          else if (typeof info.balance === "string") {
            const parsed = parseInt(info.balance, 10);
            if (!Number.isNaN(parsed)) balance = parsed;
          }
          setUser({ id: info.id, name: info.username || info.name, balance });
        }
      } catch (e) {
        // ignore info fetch errors
      }
    } catch (error) {
      if (error instanceof Error && error.name === "Unauthorized") {
        setDialogUsername(username);
        setDialogOpen(true);
      } else {
        console.error("Login failed:", error);
      }
    } finally {
      if (userId) {
        setLoading((prev) => ({ ...prev, [userId]: false }));
      }
    }
  };

  return {
    loading,
    dialogOpen,
    setDialogOpen,
    dialogUsername,
    handleLogin
  };
}