"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSettings } from "@/components/settings-context";
import { useUser } from "@/components/user-context";

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { maintenanceMode } = useSettings();
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (maintenanceMode) {
      const isAdmin = user?.is_admin;

      if (pathname === "/maintenance" || pathname === "/admin") {
        return;
      }

      if (!isAdmin) {
        router.push("/maintenance");
      }
    } else {
      if (pathname === "/maintenance") {
        router.push("/");
      }
    }
  }, [maintenanceMode, user, pathname, router]);

  if (maintenanceMode && pathname === "/admin") {
    return <>{children}</>;
  }

  if (maintenanceMode && !user?.is_admin && pathname !== "/maintenance") {
    return null;
  }

  if (!maintenanceMode && pathname === "/maintenance") {
    return null;
  }

  return <>{children}</>;
}
