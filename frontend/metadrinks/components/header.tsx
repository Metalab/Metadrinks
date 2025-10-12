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
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

type HeaderProps = {
  showSidebarTrigger?: boolean;
};

export default function Header({ showSidebarTrigger = false }: HeaderProps) {
  const pathname = usePathname();
  const { loggedIn, expiresIn, logout } = useAuth();

  return (
    <header className="relative p-8 pb-12">
      <div className="flex gap-[12px] justify-end items-center">
        {showSidebarTrigger && <SidebarTrigger />}
        <NavigationMenu>
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
        </NavigationMenu>
        {loggedIn && (
          <Button variant="destructive" onClick={logout}>
            Sign out
          </Button>
        )}
        <ModeToggle />
      </div>
      {loggedIn && expiresIn !== null && (
        <div className="flex justify-end mt-1">
          <span className="text-xs text-gray-500">
            Session expires in: {Math.floor(expiresIn / 60)}:
            {(expiresIn % 60).toString().padStart(2, "0")}
          </span>
        </div>
      )}
    </header>
  );
}
