"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentDialog } from "./payment-dialog";
import { toast } from "sonner";

interface AddBalanceDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onComplete?: () => void;
}

export function AddBalanceDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onComplete,
}: AddBalanceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? controlledOnOpenChange || (() => {})
    : setInternalOpen;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const handleCheckout = () => {
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setAmount("");
    setOpen(false);
    onComplete?.();
    toast.success("Balance added successfully");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setAmount("");
      setShowPayment(false);
    }
  };

  const amountInCents = Math.round((parseFloat(amount) || 0) * 100);
  const isValidAmount = amount && parseFloat(amount) > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Balance</DialogTitle>
          <DialogDescription>
            Enter the amount you want to add to your balance.
          </DialogDescription>
        </DialogHeader>

        {!showPayment ? (
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (€)</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                className="text-lg"
                autoFocus={false}
              />
              {amount && isValidAmount && (
                <p className="text-sm text-muted-foreground">
                  You will be charged €{parseFloat(amount).toFixed(2)}
                </p>
              )}
            </div>

            <Button
              onClick={handleCheckout}
              size="lg"
              disabled={!isValidAmount}
              className="w-full h-15"
            >
              Checkout
            </Button>
          </div>
        ) : (
          <div className="py-4">
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Amount to add:</p>
              <p className="text-2xl font-bold">
                €{parseFloat(amount).toFixed(2)}
              </p>
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-medium mb-2">Select payment method:</p>

              <PaymentDialog
                method="cash"
                amountInCents={amountInCents}
                trigger={
                  <Button
                    className="w-full h-15 items-center justify-center"
                    variant="outline"
                  >
                    Cash
                  </Button>
                }
                onComplete={handlePaymentComplete}
              />

              <PaymentDialog
                method="card"
                amountInCents={amountInCents}
                trigger={
                  <Button
                    className="w-full h-15 items-center justify-center"
                    variant="outline"
                  >
                    Card
                  </Button>
                }
                onComplete={handlePaymentComplete}
              />

              <Button
                variant="ghost"
                onClick={() => setShowPayment(false)}
                className="mt-2 h-15"
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AddBalanceDialog;
