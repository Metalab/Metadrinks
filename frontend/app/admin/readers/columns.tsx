"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpDown, Star, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Reader, ReaderStatus } from "@/types/reader";
import { Badge } from "@/components/ui/badge";

const getStatusBadgeColor = (status: ReaderStatus) => {
  const badges: Record<ReaderStatus, string> = {
    paired:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    processing:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    expired: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    unknown: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  };
  return badges[status] || badges.unknown;
};

const getModelName = (model: string) => {
  const modelNames: Record<string, string> = {
    solo: "SumUp Solo",
    "virtual-solo": "Virtual Solo",
  };
  return modelNames[model] || model;
};

export const createColumns = (
  onDeleteClick: (reader: Reader) => void,
  onSetDefault: (id: string) => Promise<void>,
  defaultReaderId?: string
): ColumnDef<Reader>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="has-[>svg]:px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const reader = row.original;
      const isDefault = defaultReaderId === reader.id;

      return (
        <div className="space-y-1">
          <div className="text-sm">
            {name}{" "}
            {isDefault && (
              <Badge variant="secondary" className="ml-1">
                Default
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {reader.id}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "device",
    header: "Device",
    cell: ({ row }) => {
      const reader = row.original;
      return (
        <div className="space-y-1">
          <div className="text-sm">{getModelName(reader.device.model)}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {reader.device.identifier}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as ReaderStatus;
      return (
        <div
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(
            status
          )}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      );
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
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="text-sm">
          {date.toLocaleDateString()}{" "}
          <span className="text-muted-foreground">
            {date.toLocaleTimeString()}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="has-[>svg]:px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("updated_at"));
      return (
        <div className="text-sm">
          {date.toLocaleDateString()}{" "}
          <span className="text-muted-foreground">
            {date.toLocaleTimeString()}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const reader = row.original;
      const isDefault = defaultReaderId === reader.id;

      return (
        <div className="flex items-center gap-2">
          {!isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await onSetDefault(reader.id);
              }}
              className="h-8"
            >
              <Star className="h-3 w-3 mr-1" />
              Make Default
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDeleteClick(reader)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      );
    },
  },
];
