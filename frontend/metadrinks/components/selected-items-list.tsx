"use client";

import { Button } from "@/components/ui/button";
import { useSelectedItems } from "@/components/selected-items-context";

export function SelectedItemsList() {
  const { selectedItems, removeItem, removeOneItem } = useSelectedItems();

  if (selectedItems.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">No items selected</div>
    );
  }

  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        {selectedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-background p-2 rounded-md"
          >
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                {item.name}
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-sm">
                  x{item.quantity}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {((item.price * item.quantity) / 100).toFixed(2)}€
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeOneItem(item.id)}
                className="text-destructive h-8 w-8 p-0"
              >
                −
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="text-destructive h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
