"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useSelectedItems } from "@/components/selected-items-context";
import Image from "next/image";

type Item = {
  id: string;
  name: string;
  image?: string;
  price: number;
  barcodes?: string[];
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
    <div
      className="w-full px-4 pb-4 flex flex-wrap justify-center"
      style={{ gap: "2rem 1rem" }}
    >
      {items.map((item) => (
        <div key={item.id} className="w-48">
          <Button
            variant="ghost"
            className="p-0 w-full min-h-68"
            onClick={() => addItem(item)}
          >
            <Card className="w-full h-full">
              <CardContent className="pt-2 px-4 pb-2 h-full flex flex-col items-center justify-center">
                <div className="aspect-square rounded-md overflow-hidden flex-shrink-0 w-full">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      className="object-contain h-full w-full"
                      width={100}
                      height={100}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <span className="text-gray-400 text-[4rem] font-bold">
                        ?
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center text-center mt-3 flex-grow w-full">
                  <CardTitle className="text-sm mb-2 text-center leading-tight w-full whitespace-normal break-words">
                    {item.name}
                  </CardTitle>
                  <span className="text-sm font-bold">
                    {(item.price / 100).toFixed(2)}€
                  </span>
                </div>
              </CardContent>
            </Card>
          </Button>
        </div>
      ))}
    </div>
  );
}
