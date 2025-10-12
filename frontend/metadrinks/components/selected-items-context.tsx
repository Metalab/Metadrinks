"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Item = {
  id: string;
  name: string;
  image?: string;
  price: number;
  barcode?: string;
};

type SelectedItemWithQuantity = Item & {
  quantity: number;
};

type SelectedItemsContextType = {
  selectedItems: SelectedItemWithQuantity[];
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  removeOneItem: (itemId: string) => void;
  clearItems: () => void;
};

const SelectedItemsContext = createContext<
  SelectedItemsContextType | undefined
>(undefined);

export function SelectedItemsProvider({ children }: { children: ReactNode }) {
  const [selectedItems, setSelectedItems] = useState<
    SelectedItemWithQuantity[]
  >([]);

  const addItem = (item: Item) => {
    setSelectedItems((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const removeOneItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const existingItem = prev.find((i) => i.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((item) => item.id !== itemId);
    });
  };

  const clearItems = () => {
    setSelectedItems([]);
  };

  return (
    <SelectedItemsContext.Provider
      value={{ selectedItems, addItem, removeItem, removeOneItem, clearItems }}
    >
      {children}
    </SelectedItemsContext.Provider>
  );
}

export function useSelectedItems() {
  const context = useContext(SelectedItemsContext);
  if (context === undefined) {
    throw new Error(
      "useSelectedItems must be used within a SelectedItemsProvider"
    );
  }
  return context;
}
