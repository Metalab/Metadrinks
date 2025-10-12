"use client";

import { SelectedItemsProvider } from "@/components/selected-items-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ItemsSidebar } from "@/components/items-sidebar";
import { useAuth } from "@/components/auth-context";
import React from "react";

export default function ItemsClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { loggedIn } = useAuth();

  return (
    <SelectedItemsProvider>
      <SidebarProvider>
        <div className="relative flex min-h-screen mt-20">
          <main className="flex-1">{children}</main>
          {loggedIn && <ItemsSidebar />}
        </div>
      </SidebarProvider>
    </SelectedItemsProvider>
  );
}
