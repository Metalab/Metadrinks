"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PaymentDialog } from "./payment-dialog";
import { useSelectedItems } from "./selected-items-context";
import { useUser } from "./user-context";
import { useSettings } from "./settings-context";
import React from "react";

export default function CheckoutButton() {
  const { clearItems, totalInCents } = useSelectedItems();
  const { user } = useUser();
  const { settings } = useSettings();

  const isCardAvailable = !!settings?.default_reader_id;
  const hasEnoughBalance = (user?.balance ?? 0) >= totalInCents;
  const isBalanceAvailable =
    !user?.is_restricted && (user?.is_trusted || hasEnoughBalance);

  async function handleComplete(result: { method: string; data?: unknown }) {
    clearItems();
    console.log(`${result.method} payment completed successfully`);
  }
  return (
    <div
      className="flex justify-center self-start pt-6 w-full"
      style={{
        all: "revert",
        display: "flex",
        justifyContent: "center",
        alignSelf: "flex-start",
        width: "100%",
        fontSize: "14px",
        lineHeight: "1.5",
        letterSpacing: "normal",
      }}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button className="w-full" size="lg">
            Checkout
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="leading-none font-medium">Checkout</h4>
              <p className="text-muted-foreground text-sm">
                How would you like to pay?
              </p>
            </div>
            <div className="grid gap-2">
              <PaymentDialog
                method="cash"
                trigger={
                  <Button
                    className="w-full items-center justify-center"
                    variant="outline"
                  >
                    Cash
                  </Button>
                }
                onComplete={handleComplete}
              />
              <PaymentDialog
                method="card"
                trigger={
                  <Button
                    className="w-full items-center justify-center"
                    variant="outline"
                    disabled={!isCardAvailable}
                  >
                    Card
                  </Button>
                }
                onComplete={handleComplete}
              />
              <PaymentDialog
                method="balance"
                trigger={
                  <Button
                    className="w-full items-center justify-center"
                    variant="outline"
                    disabled={!isBalanceAvailable}
                  >
                    Balance
                  </Button>
                }
                onComplete={handleComplete}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
