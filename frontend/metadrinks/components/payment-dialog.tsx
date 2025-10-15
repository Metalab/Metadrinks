"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSelectedItems } from "@/components/selected-items-context";
import { Spinner } from "./ui/spinner";
import { useUser } from "./user-context";
import { useSSE } from "./sse-context";
import { config } from "@/lib/config";

type KnownMethod = "cash" | "card" | "balance";

interface PaymentDialogProps {
  method?: string; // cash/card/balance
  trigger?: React.ReactNode;
  amount?: number;
  onComplete?: (result: { method: string; data?: any }) => void;
}

function CashForm({
  amount,
  onComplete,
}: {
  amount?: number;
  onComplete?: (d: any) => void;
}) {
  const [val, setVal] = useState<string>((amount ?? 0).toString());
  const { selectedItems } = useSelectedItems();
  const totalInCents = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalInEuros = (totalInCents / 100).toFixed(2);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onComplete?.({ amount: parseFloat(val || "0") });
      }}
    >
      <DialogHeader>
        <DialogTitle>Cash payment</DialogTitle>
        <DialogDescription>
          Please put the cash (€{totalInEuros}) into the register.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="pt-4">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Done</Button>
      </DialogFooter>
    </form>
  );
}

function CardForm({ onComplete }: { onComplete?: (d: any) => void }) {
  const { selectedItems } = useSelectedItems();
  const { isConnected, lastEvent } = useSSE();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientTransactionId, setClientTransactionId] = useState<string | null>(
    null
  );
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);

  // Listen for SSE transaction updates
  useEffect(() => {
    if (lastEvent?.type === "transaction_update" && clientTransactionId) {
      const { client_transaction_id, transaction_status } = lastEvent.data;

      if (client_transaction_id === clientTransactionId) {
        setStatus(transaction_status);

        if (transaction_status === "successful") {
          onComplete?.({ status: "successful", client_transaction_id });
        } else if (
          transaction_status === "failed" ||
          transaction_status === "cancelled"
        ) {
          setIsProcessing(false);
          setError(`Payment ${transaction_status}`);
        }
      }
    }
  }, [lastEvent, clientTransactionId, onComplete]);

  const startPayment = async () => {
    if (!isConnected) {
      setError("Payment system not connected. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStatus("starting");

    try {
      // Prepare purchase data
      const purchaseData = {
        items: selectedItems.map((item) => ({
          id: item.id,
          amount: item.quantity,
        })),
        payment_type: "card",
        reader_id: "rdr_2G7JVXPAV5906VAC4W9ZBDJ8F6",
      };

      // Send POST request to create purchase
      const response = await fetch(`${config.apiBaseUrl}/api/v1/purchases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create purchase: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Purchase created:", result);
      const transactionId = result.data?.client_transaction_id;

      if (!transactionId) {
        throw new Error("No client_transaction_id received from server");
      }

      setClientTransactionId(transactionId);
      setStatus("pending");
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : "Payment failed");
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "starting":
        return "Initializing payment...";
      case "pending":
        return "Please complete payment on the card reader";
      case "successful":
        return "Payment successful!";
      case "failed":
        return "Payment failed";
      case "cancelled":
        return "Payment cancelled";
      default:
        return "Ready to start payment";
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isProcessing && status === "idle") {
          startPayment();
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>Card payment</DialogTitle>
        <DialogDescription>
          {!isConnected
            ? "Payment system not connected. Please wait or try again later."
            : "Complete your payment using the card reader."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center gap-4 py-4">
        {(isProcessing || status === "pending") && <Spinner />}

        <div className="text-sm text-muted-foreground text-center">
          {error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            getStatusMessage()
          )}
        </div>

        {!isConnected && (
          <div className="text-xs text-yellow-600 text-center">
            ⚠️ Payment system disconnected
          </div>
        )}
      </div>

      <DialogFooter className="pt-4">
        <DialogClose asChild>
          <Button variant="outline" disabled={isProcessing}>
            Cancel
          </Button>
        </DialogClose>

        {!isProcessing && status === "idle" && (
          <Button type="submit" disabled={!isConnected}>
            Start Payment
          </Button>
        )}

        {error && (
          <Button
            onClick={() => {
              setError(null);
              setStatus("idle");
              setClientTransactionId(null);
            }}
          >
            Try Again
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}

function BalanceForm({ onComplete }: { onComplete?: (d: any) => void }) {
  const { totalInEuros } = useSelectedItems();
  const { user } = useUser();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        //onComplete?.({ username, amount: parseFloat(amt || "0") });
      }}
    >
      <DialogHeader>
        <DialogTitle>Balance payment</DialogTitle>
        <DialogDescription>
          Do you want to use €{totalInEuros} from your balance?
          <br />
          You currently have{" "}
          {user ? `€${(user.balance / 100).toFixed(2)}` : "N/A"} in your
          balance.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="pt-4">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Pay</Button>
      </DialogFooter>
    </form>
  );
}

export function PaymentDialog({
  method,
  trigger,
  amount,
  onComplete,
}: PaymentDialogProps) {
  const [selected, setSelected] = useState<KnownMethod | undefined>(
    (method as KnownMethod) ?? undefined
  );

  function normalizeMethod(m?: string): KnownMethod | undefined {
    if (!m) return undefined;
    const s = m.toLowerCase();
    if (s === "cash" || s === "card" || s === "balance")
      return s as KnownMethod;
    return undefined;
  }

  React.useEffect(() => {
    const m = normalizeMethod(method);
    setSelected(m);
  }, [method]);

  return (
    <Dialog>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent className="sm:max-w-[480px]">
        {!selected ? (
          <div>
            <DialogHeader>
              <DialogTitle>Select payment method</DialogTitle>
              <DialogDescription>
                Choose how to accept payment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <Button onClick={() => setSelected("cash")}>Cash</Button>
              <Button onClick={() => setSelected("card")}>Card</Button>
              <Button onClick={() => setSelected("balance")}>Balance</Button>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <div>
            {selected === "cash" && (
              <CashForm
                onComplete={(data) => onComplete?.({ method: "cash", data })}
              />
            )}
            {selected === "card" && (
              <CardForm
                onComplete={(data) => onComplete?.({ method: "card", data })}
              />
            )}
            {selected === "balance" && (
              <BalanceForm
                onComplete={(data) => onComplete?.({ method: "balance", data })}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
