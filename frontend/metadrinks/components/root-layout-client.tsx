"use client";

import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { AuthProvider } from "@/components/auth-context";
import { UserProvider } from "@/components/user-context";
import { usePathname } from "next/navigation";
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
          <Header showSidebarTrigger={false} />
          {children}
          <Toaster />
        </AuthProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
