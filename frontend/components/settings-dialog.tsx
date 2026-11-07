"use client";

import * as React from "react";
import JsBarcode from "jsbarcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Construction,
  AlertTriangle,
  Palette,
  User,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { useSettings } from "@/components/settings-context";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { config } from "@/lib/config";
import { toast } from "sonner";

interface SettingsDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SettingsDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SettingsDialogProps = {}) {
  const { user } = useUser();
  const { maintenanceMode, isEnvMaintenance, settings, refreshSettings } =
    useSettings();
  const { theme, setTheme } = useTheme();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [updatingBalance, setUpdatingBalance] = React.useState(false);
  const [minBalance, setMinBalance] = React.useState("0");
  const [maxBalance, setMaxBalance] = React.useState("0");
  const [loginBarcode, setLoginBarcode] = React.useState<string>("");
  const [refreshingBarcode, setRefreshingBarcode] = React.useState(false);
  const barcodeCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? controlledOnOpenChange || (() => {})
    : setInternalOpen;

  const isAdmin = user?.is_admin;

  React.useEffect(() => {
    setMinBalance(String(settings?.balance_settings?.min ?? 0));
    setMaxBalance(String(settings?.balance_settings?.max ?? 0));
  }, [settings?.balance_settings?.min, settings?.balance_settings?.max]);

  React.useEffect(() => {
    if (loginBarcode && barcodeCanvasRef.current) {
      try {
        JsBarcode(barcodeCanvasRef.current, loginBarcode, {
          format: "EAN13",
          width: 2,
          height: 50,
          displayValue: true,
        });
      } catch (error) {
        console.error("Failed to render barcode:", error);
      }
    }
  }, [loginBarcode]);

  const handleMaintenanceToggle = async (enabled: boolean) => {
    if (isEnvMaintenance) return;

    setUpdating(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/admin/v1/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          maintenance: enabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update settings");
      }

      await refreshSettings();

      toast.success(
        `Maintenance mode ${enabled ? "enabled" : "disabled"} successfully`,
      );
    } catch (error) {
      console.error("Failed to update maintenance mode:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update maintenance mode",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleRefreshLoginBarcode = async () => {
    if (!user?.id) return;

    setRefreshingBarcode(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/v1/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          generate_login_barcode: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate login barcode");
      }

      const data = await res.json();
      setLoginBarcode(data.data?.login_barcode || "");

      toast.success("Login barcode generated successfully");
    } catch (error) {
      console.error("Failed to generate login barcode:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate login barcode",
      );
    } finally {
      setRefreshingBarcode(false);
    }
  };

  const updateBalanceSettings = async (
    balanceSettings: { enabled?: boolean; min?: number; max?: number },
    successMessage: string,
  ) => {
    setUpdatingBalance(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/admin/v1/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ balance_settings: balanceSettings }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update balance settings");
      }

      await refreshSettings();
      toast.success(successMessage);
    } catch (error) {
      console.error("Failed to update balance settings:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update balance settings",
      );
    } finally {
      setUpdatingBalance(false);
    }
  };

  const handleBalanceToggle = async (enabled: boolean) => {
    await updateBalanceSettings(
      { enabled },
      `Balance ${enabled ? "enabled" : "disabled"} successfully`,
    );
  };

  const handleBalanceLimits = async () => {
    const min = Number(minBalance);
    const max = Number(maxBalance);

    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 0 ||
      max < 0 ||
      (max !== 0 && max < min)
    ) {
      toast.error(
        "Enter valid non-negative limits; max must be 0 or at least min",
      );
      return;
    }

    await updateBalanceSettings(
      { min, max },
      "Balance limits updated successfully",
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Manage application settings and preferences"
              : "Customize your experience"}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">User Preferences</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme-select" className="text-sm">
                Theme
              </Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme-select">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-white border border-gray-300" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-gray-900" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose how the app looks to you
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-barcode" className="text-sm">
                Login Barcode
              </Label>
              <div className="flex gap-2">
                <Input
                  id="login-barcode"
                  type="text"
                  placeholder="<not shown>"
                  value={loginBarcode || ""}
                  disabled
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefreshLoginBarcode}
                  disabled={refreshingBarcode || !user}
                >
                  {refreshingBarcode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Generate a barcode to log in with a scanner
              </p>
              {loginBarcode && (
                <div className="mt-3 flex justify-center p-4 bg-muted rounded-lg">
                  <canvas ref={barcodeCanvasRef} />
                </div>
              )}
            </div>

            {user && (
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-sm font-medium">Logged in as</p>
                <p className="text-sm text-muted-foreground">{user.name}</p>
                {isAdmin && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    Administrator
                  </p>
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="flex items-center">
                  <Construction className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-semibold">Admin Settings</h3>
                </div>

                {isEnvMaintenance && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Environment Variable Active</AlertTitle>
                    <AlertDescription>
                      Maintenance mode is forced by NEXT_PUBLIC_MAINTENANCE.
                    </AlertDescription>
                  </Alert>
                )}

                {maintenanceMode && (
                  <Alert>
                    <AlertDescription className="text-xs">
                      ⚠️ Non-admin users are currently seeing the maintenance
                      page
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-toggle" className="text-sm">
                      Maintenance Mode
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      Restrict site access to admins only
                    </div>
                  </div>
                  <Switch
                    id="maintenance-toggle"
                    checked={maintenanceMode}
                    onCheckedChange={handleMaintenanceToggle}
                    disabled={isEnvMaintenance || updating}
                  />
                  {updating && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="balance-toggle" className="text-sm">
                      Balance Payments
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      Allow users to pay with their account balance
                    </div>
                  </div>
                  <Switch
                    id="balance-toggle"
                    checked={settings?.balance_settings?.enabled ?? true}
                    onCheckedChange={handleBalanceToggle}
                    disabled={updatingBalance}
                  />
                  {updatingBalance && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Balance Limits (cents)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="minimum-balance"
                      type="number"
                      min="0"
                      value={minBalance}
                      onChange={(event) => setMinBalance(event.target.value)}
                      placeholder="Minimum"
                      disabled={updatingBalance}
                    />
                    <Input
                      id="maximum-balance"
                      type="number"
                      min="0"
                      value={maxBalance}
                      onChange={(event) => setMaxBalance(event.target.value)}
                      placeholder="Maximum"
                      disabled={updatingBalance}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleBalanceLimits}
                    disabled={updatingBalance}
                  >
                    Save Balance Limits
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Use 0 to disable either limit.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
