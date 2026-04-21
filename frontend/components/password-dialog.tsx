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
import { LockIcon, UserIcon, Eye, EyeOff, Delete } from "lucide-react";
import { useAuth } from "./auth-context";
import { User } from "./user-context";
import { useSettings } from "./settings-context";

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
    user: User | null,
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
  const [showPassword, setShowPassword] = React.useState(false);
  const { settings } = useSettings();
  const showNumpad = settings?.ui_settings?.showNumpad ?? true;

  React.useEffect(() => {
    if (open) {
      if (username) {
        setLocalUsername(username);
      } else {
        setLocalUsername("");
      }
      setPassword("");
      setError("");
      setShowPassword(false);
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
        err instanceof Error ? err.message : "Network error. Please try again.",
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
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.stopPropagation();
          }
        }}
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  inputMode={passwordInputMode}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {showNumpad && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant="outline"
                      onClick={() => setPassword(password + num)}
                      disabled={loading}
                      className="h-14 text-lg"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPassword(password + "0")}
                    disabled={loading}
                    className="col-span-2 h-14 text-lg"
                  >
                    0
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPassword(password.slice(0, -1))}
                    disabled={loading}
                    className="h-14"
                  >
                    <Delete className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
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
