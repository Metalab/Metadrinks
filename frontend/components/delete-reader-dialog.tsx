"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { Reader } from "@/types/reader";

interface DeleteReaderDialogProps {
  reader: Reader;
  isDefault: boolean;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onDelete: (id: string) => Promise<void>;
}

export function DeleteReaderDialog({
  reader,
  isDefault,
  open,
  setOpen,
  onDelete,
}: DeleteReaderDialogProps) {
  const handleDelete = async () => {
    await onDelete(reader.id);
    setOpen?.(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Reader</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{reader.name}</strong>? This
            action cannot be undone and will unlink the card reader from the
            system.
            {isDefault && (
              <span className="block mt-2 text-orange-600 dark:text-orange-400 font-medium">
                This is currently the default reader. Deleting it will clear the
                default reader setting.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
