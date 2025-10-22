"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { AuthProvider } from "@/components/auth-context";
import { UserProvider } from "@/components/user-context";
import { SSEProvider } from "@/components/sse-context";
import SSEConnectionStatus from "@/components/sse-connection-status";
import { Toaster } from "@/components/ui/sonner";
import { ThemeColorMeta } from "@/components/theme-color-meta";
import { SettingsProvider } from "@/components/settings-context";
import { MaintenanceGuard } from "@/components/maintenance-guard";

export default function RootLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isMaintenancePage = pathname === "/maintenance";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeColorMeta />
      <UserProvider>
        <SettingsProvider>
          <AuthProvider>
            <SSEProvider>
              <MaintenanceGuard>
                <div className="flex flex-col h-screen">
                  <Header showSidebarTrigger={false} />
                  <div className="flex-1">{children}</div>
                </div>
              </MaintenanceGuard>
              {!isMaintenancePage && <SSEConnectionStatus />}
              <Toaster />
            </SSEProvider>
          </AuthProvider>
        </SettingsProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
