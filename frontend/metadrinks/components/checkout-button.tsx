"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PaymentDialog } from "./payment-dialog";
import { useSelectedItems } from "./selected-items-context";
import React from "react";

export default function CheckoutButton() {
  const { selectedItems, clearItems } = useSelectedItems();

  async function handleComplete(result: { method: string; data?: any }) {
    if (result.method !== "cash") return;

    const payload = {
      items: selectedItems.map((i) => ({ id: i.id, amount: i.quantity })),
      payment_type: "cash",
    } as const;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/purchases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );
      console.log(JSON.stringify(payload));
      if (!res.ok) {
        console.error("Failed to create purchase", await res.text());
        return;
      }

      clearItems();
      console.log("Purchase created successfully");
    } catch (err) {
      console.error("Error creating purchase", err);
    }
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
