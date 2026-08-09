"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-context";

export function useLogin() {
  const [loading, setLoading] = useState<{ [id: string]: boolean }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogUsername, setDialogUsername] = useState("");

  const { login } = useAuth();
  
  const handleLogin = async (username: string, userId: string) => {
    // prevent double logins when loading
    if (loading[userId]) {
      return;
    }
    
    if (userId) {
      setLoading((prev) => ({ ...prev, [userId]: true }));
    }

    try {
      await login(username);
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