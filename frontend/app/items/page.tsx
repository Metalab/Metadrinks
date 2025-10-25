"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import ItemCards from "@/components/item-cards";
import { BarcodeSearchInput } from "@/components/search-barcode-input";
import { useSelectedItems } from "@/components/selected-items-context";
import { useContentUpdates } from "@/hooks/use-sse-events";
import { config } from "@/lib/config";
import { Item } from "@/types/item";

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useSelectedItems();
  const hasFetchedRef = useRef(false);

  const fetchItems = useCallback(() => {
    fetch(`${config.apiBaseUrl}/api/v1/items`)
      .then((res) => res.json())
      .then((data) => {
        const items: Item[] = Array.isArray(data) ? data : data.data || [];
        setItems(items);
        setLoading(false);
      })
      .catch(() => {
        setItems([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchItems();
    }
  }, [fetchItems]);

  useContentUpdates(
    (data) => {
      if (data.content_payload.type === "items") {
        fetchItems();
      }
    },
    [fetchItems]
  );

  if (loading) {
    return <div className="flex justify-center mt-20">Loading...</div>;
  }

  return (
    <div className="p-4">
      <BarcodeSearchInput items={items} visible={false} />
      <ItemCards items={items} onItemClick={addItem} />
    </div>
  );
}
