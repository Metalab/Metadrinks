"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {Dispatch, SetStateAction, SubmitEvent} from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";

interface UserDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  username?: string;
  onUserCreated?: () => void;
}

export function UserDialog({
  open,
  setOpen,
  username,
  onUserCreated,
}: UserDialogProps) {
  const router = useRouter();

  const handleSubmit = async (event?: SubmitEvent) => {
    event?.preventDefault();

    const nameInput = document.getElementById("name") as HTMLInputElement;
    const pinInput = document.getElementById("pin") as HTMLInputElement;
    const name = nameInput?.value;
    const pin = pinInput?.value;

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, password: pin }),
      });

      if (response.ok) {
        toast("User created successfully");
        setOpen(false);
        router.refresh();
        onUserCreated?.();
      } else {
        const error = await response.text();
        toast.error("Failed to create user: " + error);
      }
    } catch (error) {
      toast.error("Failed to create user: " + (error as Error).message);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-[425px]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
              <DialogDescription>
                Enter the details for the new user.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your username"
                  maxLength={24}
                  defaultValue={username}
                  disabled={!!username}
                  required
                  autoFocus={false}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="pin">PIN</Label>
                <Input
                  id="pin"
                  name="pin"
                  type="password"
                  placeholder="4-10 digit PIN (optional)"
                  minLength={4}
                  maxLength={10}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  autoFocus={false}
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
