"use client";

import { useEffect } from "react";
import { useSelectedItems } from "./selected-items-context";

type Item = {
  id: string;
  name: string;
  image?: string;
  price: number;
  barcodes?: string[];
};

export function BarcodeItemListener() {
  const { addItem } = useSelectedItems();

  useEffect(() => {
    const handleBarcodeItemScanned = (event: Event) => {
      const customEvent = event as CustomEvent<{ item: Item }>;
      const { item } = customEvent.detail;
      if (item) {
        addItem(item);
      }
    };

    window.addEventListener("barcode-item-scanned", handleBarcodeItemScanned);

    return () => {
      window.removeEventListener(
        "barcode-item-scanned",
        handleBarcodeItemScanned
      );
    };
  }, [addItem]);

  return null;
}
