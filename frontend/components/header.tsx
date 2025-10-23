"use client";

import { ModeToggle } from "@/components/ui/theme-mode-toggle";
import Link from "next/link";
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

type HeaderProps = {
  showSidebarTrigger?: boolean;
};

export default function Header({ showSidebarTrigger = false }: HeaderProps) {
  const { loggedIn, expiresIn, logout } = useAuth();
  const { user } = useUser();
  const { maintenanceMode } = useSettings();

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
                      <Link href="/admin">Home</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/admin/items">Items</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/admin/users">Users</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/admin/purchases">Purchases</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/admin/readers">Readers</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              ) : (
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/">Home</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/items">Items</Link>
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
