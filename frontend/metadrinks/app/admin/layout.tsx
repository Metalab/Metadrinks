"use client";

import { useAuth } from "@/components/auth-context";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { enableAutoRefresh } = useAuth();

  useEffect(() => {
    enableAutoRefresh(true);

    return () => {
      enableAutoRefresh(false);
    };
  }, [enableAutoRefresh]);

  return <>{children}</>;
}
