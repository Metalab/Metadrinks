"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Reader } from "@/types/reader";
import { Spinner } from "./ui/spinner";

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
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete(reader.id);
      setOpen?.(false);
    } finally {
      setIsDeleting(false);
    }
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
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Spinner />}
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
