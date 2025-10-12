"use client";

import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSelectedItems } from "./selected-items-context";

interface Item {
  id: string;
  name: string;
  price: number;
  barcode?: string;
}

interface SearchInputProps {
  items: Item[];
}

export function SearchInput({ items }: SearchInputProps) {
  const [value, setValue] = useState<string>("");
  const valueRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const { addItem } = useSelectedItems();

  const handleBarcodeScan = (barcode: string) => {
    const foundItem = items.find((item: Item) => item.barcode === barcode);
    if (foundItem) {
      addItem(foundItem);
      setValue("");
      valueRef.current = "";
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  useEffect(() => {
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
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-16 flex items-center justify-center z-10">
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
        {
          //call product dialog from here with the barcode value
        }
      </div>
    </div>
  );
}
