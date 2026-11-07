"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpDown, UserPen, ShieldIcon, UserIcon } from "lucide-react";
import { User } from "@/components/user-context";
import { ColumnDef } from "@tanstack/react-table";
import { IconClipboard } from "@tabler/icons-react";

export const columns = (
  onEditUser: (user: User) => void,
  currentUserId?: string
): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original;
      const isCurrentUser = currentUserId && user.id === currentUserId;
      const isAdmin = user.is_admin;

      return (
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div title="Admin">
              <ShieldIcon className="h-4 w-4 text-purple-500" />
            </div>
          )}
          {isCurrentUser && (
            <div title="Current User">
              <UserIcon className="h-4 w-4 text-blue-500" />
            </div>
          )}
          <span>{user.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "balance",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="has-[>svg]:px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Balance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("balance")) / 100;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
      }).format(amount);

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="has-[>svg]:px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Active
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isActive = row.getValue("is_active");
      return <div>{isActive ? "✅" : "❌"}</div>;
    },
  },
  {
    accessorKey: "is_trusted",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="has-[>svg]:px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Trusted
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isTrusted = row.getValue("is_trusted");
      return <div>{isTrusted ? "✅" : "❌"}</div>;
    },
  },
  {
    accessorKey: "is_restricted",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="has-[>svg]:px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Restricted
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isRestricted = row.getValue("is_restricted");
      return <div>{isRestricted ? "✅" : "❌"}</div>;
    },
  },
  {
    accessorKey: "is_admin",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="has-[>svg]:px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Admin
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isAdmin = row.getValue("is_admin");
      return <div>{isAdmin ? "✅" : "❌"}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <div className="flex flex-row gap-2 items-end justify-end">
          <Button variant="outline" size="sm" onClick={() => onEditUser(user)}>
            <UserPen /> Edit user
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText(user.id)}
          >
            <IconClipboard /> Copy ID
          </Button>
        </div>
      );
    },
    meta: {
      className: "w-[200px]",
    },
  },
];
