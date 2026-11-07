"use client";

import { useState } from "react";
import { MoreHorizontalIcon, Wallet, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddBalanceDialog } from "./add-balance-dialog";
import SettingsDialog from "./settings-dialog";

export function MoreDropdownMenu() {
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" aria-label="Open menu" size="icon-sm">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuLabel>Menu</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setShowAddBalance(true)}>
              <Wallet className="mr-2 h-4 w-4" />
              Add Balance
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowSettings(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddBalanceDialog
        open={showAddBalance}
        onOpenChange={setShowAddBalance}
        onComplete={() => {
          setShowAddBalance(false);
        }}
      />

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
