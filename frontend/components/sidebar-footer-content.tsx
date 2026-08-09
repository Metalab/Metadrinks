"use client";

import { useSelectedItems } from "@/components/selected-items-context";
import CheckoutButton from "./checkout-button";

export function SidebarFooterContent() {
  const { selectedItems } = useSelectedItems();

  const totalInCents = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalInEuros = (totalInCents / 100).toFixed(2);

  return (
    <div className="p-4 border-t">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold">Total:</span>
        <span className="text-lg font-semibold">€{totalInEuros}</span>
      </div>
      {selectedItems.length > 0 && <CheckoutButton />}
    </div>
  );
}
