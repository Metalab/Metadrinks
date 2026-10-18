"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { CreditCard, Loader2 } from "lucide-react";
import { config } from "@/lib/config";
import { toast } from "sonner";

interface LinkReaderDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function LinkReaderDialog({
  open,
  setOpen,
  onSuccess,
}: LinkReaderDialogProps) {
  const [name, setName] = React.useState("");
  const [pairingCode, setPairingCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setName("");
      setPairingCode("");
      setError("");
    }
  }, [open]);

  const handlePairingCodeChange = (value: string) => {
    // Filter to only alphanumeric characters and convert to uppercase
    const filtered = value
      .split("")
      .filter((char) => /[0-9A-Za-z]/.test(char))
      .join("")
      .toUpperCase();
    setPairingCode(filtered);
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Reader name is required");
      return;
    }

    if (pairingCode.length !== 8 && pairingCode.length !== 9) {
      setError("Pairing code must be 8 or 9 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${config.apiBaseUrl}/api/payment/v1/readers/link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            pairing_code: pairingCode,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to link reader");
      }

      toast.success("Reader linked successfully!");
      onSuccess?.();
      setOpen(false);
      setName("");
      setPairingCode("");
    } catch (err) {
      console.error("Reader linking error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Link Card Reader
            </DialogTitle>
            <DialogDescription>
              Give your reader a name and enter the pairing code displayed on
              the device.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Reader Name</Label>
              <Input
                id="name"
                placeholder="e.g., Main Counter, Bar Station"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="flex flex-col items-center gap-4">
              <Label htmlFor="pairing-code" className="text-base font-medium">
                Pairing Code
              </Label>
              <InputOTP
                id="pairing-code"
                maxLength={9}
                value={pairingCode}
                onChange={handlePairingCodeChange}
                disabled={loading}
                pattern="[0-9A-Z]*"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                  <InputOTPSlot index={6} />
                  <InputOTPSlot index={7} />
                  <InputOTPSlot index={8} />
                </InputOTPGroup>
              </InputOTP>
              <p className="text-xs text-muted-foreground text-center">
                The pairing code is shown on the card reader screen
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-500 text-center">{error}</div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !name.trim() ||
                (pairingCode.length !== 8 && pairingCode.length !== 9)
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Linking..." : "Link Reader"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
