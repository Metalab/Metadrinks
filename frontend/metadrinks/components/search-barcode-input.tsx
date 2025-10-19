"use client";

import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./auth-context";

interface Item {
  id: string;
  name: string;
  price: number;
  barcodes?: string[];
}

interface SearchInputProps {
  items?: Item[];
  visible?: boolean;
}

export function BarcodeSearchInput({
  items = [],
  visible = true,
}: SearchInputProps) {
  const [value, setValue] = useState<string>("");
  const valueRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedBarcodeRef = useRef<boolean>(false);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setValue("");
      valueRef.current = "";
      timerRef.current = null;
    }, 5000); // 5 seconds
  };

  const { loggedIn, login } = useAuth();

  const handleBarcodeScan = async (barcode: string) => {
    // If not logged in, store the barcode and login as guest
    if (!loggedIn) {
      sessionStorage.setItem("pendingBarcode", barcode);
      try {
        await login("Guest");
      } catch (error) {
        console.error("Failed to login as guest:", error);
        sessionStorage.removeItem("pendingBarcode");
      }
      setValue("");
      valueRef.current = "";
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // If logged in and we have items, dispatch event for the item to be added
    // The items page will listen for this event and add it using the context
    const foundItem = items.find((item: Item) =>
      item.barcodes?.includes(barcode)
    );
    if (foundItem) {
      const event = new CustomEvent("barcode-item-scanned", {
        detail: { item: foundItem },
      });
      window.dispatchEvent(event);

      setValue("");
      valueRef.current = "";
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (loggedIn && items.length > 0 && !processedBarcodeRef.current) {
      const pendingBarcode = sessionStorage.getItem("pendingBarcode");
      if (pendingBarcode) {
        const foundItem = items.find((item: Item) =>
          item.barcodes?.includes(pendingBarcode)
        );
        if (foundItem) {
          const event = new CustomEvent("barcode-item-scanned", {
            detail: { item: foundItem },
          });
          window.dispatchEvent(event);
          processedBarcodeRef.current = true;
        }
        sessionStorage.removeItem("pendingBarcode");
      }
    }
  }, [loggedIn, items]);

  useEffect(() => {
    if (document.activeElement?.tagName === "INPUT") {
      return;
    }

    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key;
      if (/^[0-9]$/.test(key)) {
        // append digit and keep ref in sync
        setValue((prev) => {
          const next = prev + key;
          valueRef.current = next;
          return next;
        });
        resetTimer();
      } else if (key === "Enter" && valueRef.current) {
        // read from ref to avoid stale closures
        handleBarcodeScan(valueRef.current);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-16 flex items-center justify-center z-10 pointer-events-none">
      {/*make this invisible here*/}
      <div className="relative w-72">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search barcode..."
          value={value || ""}
          readOnly
          disabled={true}
          className="pl-10"
        />
      </div>
    </div>
  );
}
