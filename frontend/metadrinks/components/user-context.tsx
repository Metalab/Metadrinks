"use client";

import React, { createContext, useContext, useState } from "react";

export type User = {
  id?: string;
  name: string;
  image?: string;
  balance?: number;
  is_active?: boolean;
};

type UserContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};
