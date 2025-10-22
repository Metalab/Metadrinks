"use client";

import * as React from "react";
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
import { LockIcon, UserIcon } from "lucide-react";
import { useAuth } from "./auth-context";
import { User } from "./user-context";

export default function PasswordDialog({
  open,
  setOpen,
  username,
  description,
  disableClose = false,
  redirect = true,
  onSuccess,
  onValidate,
  passwordInputMode = "text",
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  username: string;
  description?: string;
  disableClose?: boolean;
  redirect?: boolean;
  onSuccess?: () => void;
  onValidate?: (
    user: User | null
  ) => Promise<{ isValid: boolean; error?: string }>;
  passwordInputMode?:
    | "text"
    | "numeric"
    | "decimal"
    | "tel"
    | "search"
    | "email"
    | "url"
    | "none";
}) {
  const [localUsername, setLocalUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (username) {
      setLocalUsername(username);
    } else {
      setLocalUsername("");
    }
  }, [username, open]);

  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Prevent double submission
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const userData = await login(localUsername, password, redirect);

      if (onValidate) {
        const validation = await onValidate(userData);
        if (!validation.isValid) {
          setError(validation.error || "Validation failed");
          return;
        }
      }

      onSuccess?.();
      setOpen(false);
      setPassword("");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={disableClose ? undefined : setOpen}>
      <DialogContent
        className="sm:max-w-[425px]"
        onEscapeKeyDown={(e) => disableClose && e.preventDefault()}
        onPointerDownOutside={(e) => disableClose && e.preventDefault()}
        showCloseButton={!disableClose}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Authentication required</DialogTitle>
            <DialogDescription>
              {description ?? "This page has asked you to log in."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-3">
              <Label htmlFor="user-icon">Username</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="user-icon"
                  type="text"
                  placeholder="Enter username"
                  value={localUsername}
                  onChange={(e) => setLocalUsername(e.target.value)}
                  disabled={!!username}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid w-full max-w-sm items-center gap-3">
              <Label htmlFor="password-icon">Password</Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password-icon"
                  type="password"
                  placeholder="Enter password"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  inputMode={passwordInputMode}
                />
              </div>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
