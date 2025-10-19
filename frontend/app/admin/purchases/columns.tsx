"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpDown, UserSearchIcon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Purchase } from "@/types/purchase";
import { Item } from "@/types/item";
import { useState } from "react";
import { config } from "@/lib/config";

const UserIdCell = ({ userId }: { userId: string }) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resolveUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/v1/users/${userId}`, {
        credentials: "include",
      });
      const data = await res.json();
      const user = data.data || data;
      setUserName(user.name);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUserName("Unknown");
    } finally {
      setLoading(false);
    }
  };

  if (userName) {
    return <div className="text-sm">{userName}</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="font-mono text-xs">{userId.slice(0, 8)}...</div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={resolveUser}
        disabled={loading}
      >
        <UserSearchIcon className="h-3 w-3" />
      </Button>
    </div>
  );
};

export const columns: ColumnDef<Purchase>[] = [
  {
    accessorKey: "id",
    header: "Purchase ID",
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return <div className="font-mono text-xs">{id.slice(0, 8)}...</div>;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="has-[>svg]:px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <div>{date.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "payment_type",
    header: "Payment Type",
    cell: ({ row }) => {
      const paymentType = row.getValue("payment_type") as string;
      const badges: Record<string, string> = {
        cash: "bg-green-100 text-green-800",
        card: "bg-blue-100 text-blue-800",
        balance: "bg-purple-100 text-purple-800",
      };
      return (
        <div
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            badges[paymentType] || "bg-gray-100 text-gray-800"
          }`}
        >
          {paymentType}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const badges: Record<string, string> = {
        SUCCESSFUL: "bg-green-100 text-green-800",
        PENDING: "bg-yellow-100 text-yellow-800",
        FAILED: "bg-red-100 text-red-800",
      };
      return (
        <div
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            badges[status] || "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "final_cost",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="has-[>svg]:px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("final_cost")) / 100;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.getValue("items") as Item[];
      if (!items || items.length === 0) {
        return <div className="text-muted-foreground">No items</div>;
      }
      return (
        <div className="text-sm">
          {items.map((item, idx) => (
            <div key={idx}>
              {item.amount}x {item.name}
            </div>
          ))}
        </div>
      );
    },
  },
];
