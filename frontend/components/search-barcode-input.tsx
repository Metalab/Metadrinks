"use client";

import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./auth-context";
import { toast } from "sonner";
import { useSelectedItems } from "./selected-items-context";
import { config } from "@/lib/config";

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

  const { loggedIn, login, logout } = useAuth();
  const selectedItemsRef = useRef<Array<{ id: string; quantity: number }>>([]);
  const clearItemsRef = useRef<(() => void) | undefined>(undefined);

  // safely access selectedItems context - not available in all contexts
  try {
    const context = useSelectedItems();
    selectedItemsRef.current = context.selectedItems;
    clearItemsRef.current = context.clearItems;
  } catch {
    selectedItemsRef.current = [];
    clearItemsRef.current = undefined;
  }

  const handleBarcodeScan = async (barcode: string) => {
    const isLoginBarcode = barcode.length === 13 && /^04[0-9]/.test(barcode);

    if (!loggedIn && isLoginBarcode) {
      try {
        await login("", undefined, true, barcode);
      } catch (error) {
        toast.error("Login failed", {
          description: `Failed to log in with barcode: ${error}`,
        });
      }
      setValue("");
      valueRef.current = "";
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!loggedIn) {
      sessionStorage.setItem("pendingBarcode", barcode);
      try {
        await login("Guest");
      } catch (error) {
        toast.error("Login failed", {
          description: `Failed to log in as guest: ${error}`,
        });
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

    if (loggedIn && isLoginBarcode) {
      // keep current items, switch to new user, then create purchase with new user's balance
      // also gets the latest state from the ref when scanning
      const itemsToCheckout = [...selectedItemsRef.current];

      try {
        await login("", undefined, false, barcode);

        // create purchase with items from previous user
        if (itemsToCheckout.length > 0) {
          try {
            const payload = {
              items: itemsToCheckout.map((item) => ({
                id: item.id,
                amount: item.quantity,
              })),
              payment_type: "balance",
            };

            const response = await fetch(
              `${config.apiBaseUrl}/api/v1/purchases`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
              },
            );

            if (!response.ok) {
              const errorText = await response.text();
              let errorMessage = "Payment failed";
              try {
                const errorData = JSON.parse(errorText);
                errorMessage =
                  errorData.message || errorData.error || errorMessage;
              } catch {}
              throw new Error(errorMessage);
            }

            if (clearItemsRef.current) {
              clearItemsRef.current();
            }

            logout();
            toast.success("Purchase completed", {
              description:
                "Payment successful. €" +
                ((await response.json()).data.remaining_balance / 100).toFixed(
                  2,
                ) +
                " remaining.",
            });
          } catch (error) {
            toast.error("Purchase failed", {
              description:
                error instanceof Error
                  ? error.message
                  : "Failed to complete purchase",
            });
          }
        } else {
          toast.success("User switched", {
            description: "Logged in with new user",
          });
        }
      } catch (error) {
        toast.error("Login failed", {
          description: `Failed to log in with barcode: ${error}`,
        });
      }
      setValue("");
      valueRef.current = "";
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const foundItem = items.find((item: Item) =>
      item.barcodes?.includes(barcode),
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
    } else {
      toast.error("Item not found", {
        description: `No item found with barcode ${barcode}`,
      });

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
          item.barcodes?.includes(pendingBarcode),
        );
        if (foundItem) {
          const event = new CustomEvent("barcode-item-scanned", {
            detail: { item: foundItem },
          });
          window.dispatchEvent(event);
          processedBarcodeRef.current = true;
        } else {
          toast.error("Item not found", {
            description: `No item found with barcode ${pendingBarcode}`,
          });
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
