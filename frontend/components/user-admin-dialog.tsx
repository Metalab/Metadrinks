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
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserIcon,
  WalletIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  ShieldIcon,
  ShieldUserIcon,
  KeyRoundIcon,
} from "lucide-react";
import { config } from "@/lib/config";
import { User } from "@/components/user-context";

export default function UserAdminDialog({
  open,
  setOpen,
  user,
  onSuccess,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  user?: User | null;
  onSuccess?: () => void;
}) {
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  //const [image, setImage] = React.useState("");
  const [balance, setBalance] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [isTrusted, setIsTrusted] = React.useState(false);
  const [isRestricted, setIsRestricted] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const isEditMode = !!user?.id;

  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPassword("");
      //setImage(user.image || "");
      setBalance(user.balance?.toString() || "0");
      setIsActive(user.is_active ?? true);
      setIsTrusted(user.is_trusted ?? false);
      setIsRestricted(user.is_restricted ?? false);
      setIsAdmin(user.is_admin ?? false);
    } else {
      setName("");
      setPassword("");
      //setImage("");
      setBalance("0");
      setIsActive(true);
      setIsTrusted(false);
      setIsRestricted(false);
      setIsAdmin(false);
    }
    setError("");
  }, [user, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userData: Partial<User> & { password?: string; balance?: number } =
        {
          name,
          is_active: isActive,
          is_trusted: isTrusted,
          is_restricted: isRestricted,
          is_admin: isAdmin,
        };

      if (isEditMode) {
        userData.balance = parseInt(balance, 10);
      }

      if (password) {
        userData.password = password;
      }

      const url = isEditMode
        ? `${config.apiBaseUrl}/api/v1/users/${user.id}`
        : `${config.apiBaseUrl}/admin/v1/users`;

      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error || `Failed to ${isEditMode ? "update" : "create"} user`
        );
      }

      onSuccess?.();
      setOpen(false);

      setName("");
      setPassword("");
      //setImage("");
      setBalance("0");
      setIsActive(true);
      setIsTrusted(false);
      setIsRestricted(false);
      setIsAdmin(false);
    } catch (err) {
      console.error("User operation error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit User" : "Create New User"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the user details below."
                : "Fill in the details to create a new user."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="User name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  maxLength={24}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid w-full items-center gap-3">
              <Label htmlFor="password">
                Password
                {isEditMode && (
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}
                    (leave blank to keep unchanged)
                  </span>
                )}
              </Label>
              <div className="relative">
                <KeyRoundIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={
                    isEditMode
                      ? "Enter new password to change"
                      : "Enter password (optional)"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            {/* <div className="grid w-full items-center gap-3">
              <Label htmlFor="image">Image URL</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="image"
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>*/}

            {isEditMode && (
              <div className="grid w-full items-center gap-3">
                <Label htmlFor="balance">
                  Balance (cents) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <WalletIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="balance"
                    type="number"
                    placeholder="Balance in cents (e.g., 1000 for $10.00)"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    disabled={loading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="grid w-full gap-4 pt-4">
              <Label>Permissions & Status</Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                  disabled={loading}
                />
                <div className="flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4 text-muted-foreground" />
                  <Label
                    htmlFor="is_active"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Active
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_trusted"
                  checked={isTrusted}
                  onCheckedChange={(checked) => setIsTrusted(checked === true)}
                  disabled={loading}
                />
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
                  <Label
                    htmlFor="is_trusted"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Trusted
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_restricted"
                  checked={isRestricted}
                  onCheckedChange={(checked) =>
                    setIsRestricted(checked === true)
                  }
                  disabled={loading}
                />
                <div className="flex items-center gap-2">
                  <ShieldAlertIcon className="h-4 w-4 text-muted-foreground" />
                  <Label
                    htmlFor="is_restricted"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Restricted
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_admin"
                  checked={isAdmin}
                  onCheckedChange={(checked) => setIsAdmin(checked === true)}
                  disabled={loading}
                />
                <div className="flex items-center gap-2">
                  <ShieldUserIcon className="h-4 w-4 text-muted-foreground" />
                  <Label
                    htmlFor="is_admin"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Admin
                  </Label>
                </div>
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
              {loading
                ? "Saving..."
                : isEditMode
                ? "Update User"
                : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
