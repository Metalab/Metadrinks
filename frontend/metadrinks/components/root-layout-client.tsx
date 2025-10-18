"use client";

import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { AuthProvider } from "@/components/auth-context";
import { UserProvider } from "@/components/user-context";
import { SSEProvider } from "@/components/sse-context";
import SSEConnectionStatus from "@/components/sse-connection-status";
import { Toaster } from "@/components/ui/sonner";
import { ThemeColorMeta } from "@/components/theme-color-meta";

export default function RootLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeColorMeta />
      <UserProvider>
        <AuthProvider>
          <SSEProvider>
            <div className="flex flex-col h-screen overflow-hidden">
              <Header showSidebarTrigger={false} />
              <div className="flex-1 overflow-hidden">{children}</div>
            </div>
            <SSEConnectionStatus />
            <Toaster />
          </SSEProvider>
        </AuthProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
