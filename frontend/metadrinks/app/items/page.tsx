"use client";

import { useEffect, useState } from "react";
import ItemCards from "@/components/item-cards";
import { SearchInput } from "@/components/search-barcode-input";
import { config } from "@/lib/config";

type Item = {
  id: string;
  name: string;
  image?: string;
  price: number;
  barcode?: string;
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${config.apiBaseUrl}/api/v1/items`)
      .then((res) => res.json())
      .then((data) => {
        let items: Item[] = Array.isArray(data) ? data : data.data || [];
        setItems(items);
        setLoading(false);
      })
      .catch(() => {
        setItems([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex justify-center mt-20">Loading...</div>;
  }

  return (
    <div>
      <SearchInput items={items} />
      <div>
        <div className="p-8 pb-20 flex flex-row flex-wrap justify-center gap-4">
          <ItemCards items={items} />
        </div>
      </div>
    </div>
  );
}
