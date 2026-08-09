"use client";

import { config } from "@/lib/config";
import React, { createContext, useContext, useState } from "react";

export type User = {
  id: string;
  name: string;
  image?: string;
  balance: number;
  is_active: boolean;
  is_trusted: boolean;
  is_restricted: boolean;
  is_admin: boolean;
};

type UserContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
  fetchUser: (id: string) => Promise<User>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};

export const fetchUser = async (id: string) => {
  const res = await fetch(`${config.apiBaseUrl}/api/v1/users/${id}`, {
    method: "GET",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }
  const data = await res.json();
  return data.data as User;
};
