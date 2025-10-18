"use client";

import { SelectedItemsProvider } from "@/components/selected-items-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ItemsSidebar } from "@/components/items-sidebar";
import { useAuth } from "@/components/auth-context";
import { BarcodeItemListener } from "@/components/barcode-item-listener";
import React from "react";

export default function ItemsClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { loggedIn } = useAuth();

  return (
    <SelectedItemsProvider>
      <BarcodeItemListener />
      <SidebarProvider>
        <div className="relative flex h-full">
          <main className="flex-1 overflow-auto">{children}</main>
          {loggedIn && <ItemsSidebar />}
        </div>
      </SidebarProvider>
    </SelectedItemsProvider>
  );
}
