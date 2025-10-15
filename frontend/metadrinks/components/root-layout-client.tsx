"use client";

import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { AuthProvider } from "@/components/auth-context";
import { UserProvider } from "@/components/user-context";
import { SSEProvider } from "@/components/sse-context";
import SSEConnectionStatus from "@/components/sse-connection-status";
import { Toaster } from "@/components/ui/sonner";

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
      <UserProvider>
        <AuthProvider>
          <SSEProvider>
            <Header showSidebarTrigger={false} />
            {children}
            <SSEConnectionStatus />
            <Toaster />
          </SSEProvider>
        </AuthProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
