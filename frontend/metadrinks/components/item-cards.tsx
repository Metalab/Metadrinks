"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useSelectedItems } from "@/components/selected-items-context";
import { config } from "@/lib/config";

type Item = {
  id: string;
  name: string;
  image?: string;
  price: number;
  barcode?: string;
};

interface ItemCardsProps {
  items: Item[];
}

export default function ItemCards({ items }: ItemCardsProps) {
  const { addItem } = useSelectedItems();

  if (items.length === 0) {
    return (
      <div className="w-full p-6 flex justify-center text-gray-500">
        No results found.
      </div>
    );
  }

  return (
    <div className="w-full p-6 flex flex-row flex-wrap gap-4 justify-center">
      {items.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          className="p-0 w-48 justify-between relative"
          onClick={() => addItem(item)}
        >
          <Card key={item.id} className="w-48">
            <CardContent className="p-3">
              <div className="aspect-square rounded-md mb-2">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="object-contain h-full w-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full">
                    <span className="text-gray-400 text-[4rem] font-bold">
                      ?
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center items-center">
                <CardTitle className="text-sm mb-1">{item.name}</CardTitle>
                <span className="text-sm font-bold">
                  {(item.price / 100).toFixed(2)}€
                </span>
              </div>
            </CardContent>
          </Card>
        </Button>
      ))}
    </div>
  );
}
