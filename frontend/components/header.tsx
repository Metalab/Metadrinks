"use client";

import { ModeToggle } from "@/components/ui/theme-mode-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/components/auth-context";
import { useUser } from "@/components/user-context";
import { useSettings } from "@/components/settings-context";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { MoreDropdownMenu } from "./more-dropdown";
import { cn } from "@/lib/utils";

type HeaderProps = {
  showSidebarTrigger?: boolean;
};

export default function Header({ showSidebarTrigger = false }: HeaderProps) {
  const { loggedIn, expiresIn, logout } = useAuth();
  const { user } = useUser();
  const { maintenanceMode } = useSettings();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" || path === "/admin") {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="relative p-4 pb-8">
      <div className="flex gap-[12px] justify-end items-center">
        {maintenanceMode ? (
          <ModeToggle />
        ) : (
          <>
            {showSidebarTrigger && <SidebarTrigger />}
            <NavigationMenu>
              {loggedIn && user?.is_admin ? (
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/admin"
                        className={cn(
                          isActive("/admin") &&
                            "font-semibold underline underline-offset-4"
                        )}
                      >
                        Home
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/admin/items"
                        className={cn(
                          isActive("/admin/items") &&
                            "font-semibold underline underline-offset-4"
                        )}
                      >
                        Items
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/admin/users"
                        className={cn(
                          isActive("/admin/users") &&
                            "font-semibold underline underline-offset-4"
                        )}
                      >
                        Users
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/admin/purchases"
                        className={cn(
                          isActive("/admin/purchases") &&
                            "font-semibold underline underline-offset-4"
                        )}
                      >
                        Purchases
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/admin/readers"
                        className={cn(
                          isActive("/admin/readers") &&
                            "font-semibold underline underline-offset-4"
                        )}
                      >
                        Readers
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              ) : (
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/"
                        className={cn(
                          isActive("/") &&
                            "font-semibold underline underline-offset-4"
                        )}
                      >
                        Home
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/items"
                        className={cn(
                          isActive("/items") &&
                            "font-semibold underline underline-offset-4"
                        )}
                      >
                        Items
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              )}
            </NavigationMenu>
            {loggedIn && (
              <>
                <MoreDropdownMenu />
                <Button variant="destructive" onClick={() => logout()}>
                  Sign out
                </Button>
              </>
            )}
            <ModeToggle />
          </>
        )}
      </div>
      {loggedIn && expiresIn !== null && (
        <div className="absolute top-[3rem] right-4">
          <span className="text-xs text-gray-500">
            Session expires in: {Math.floor(expiresIn / 60)}:
            {(expiresIn % 60).toString().padStart(2, "0")}
          </span>
        </div>
      )}
    </header>
  );
}
