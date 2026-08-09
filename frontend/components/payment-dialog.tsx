"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { useAuth } from "./auth-context";
import { config } from "@/lib/config";
import { useSettings } from "./settings-context";

type KnownMethod = "cash" | "card" | "balance";

interface PaymentDialogProps {
  method?: string; // cash/card/balance
  trigger?: React.ReactNode;
  amountInCents?: number; // custom amount for balance top-up
  onComplete?: (result: { method: string; data?: unknown }) => void;
}

interface PaymentFormProps {
  onComplete?: (d: unknown) => void;
  amountInCents?: number; // custom amount for balance top-up
}

function usePaymentCompletion(
  initialCompleted = false,
  onComplete?: () => void,
) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [countdown, setCountdown] = useState(5);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (isCompleted && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isCompleted && countdown === 0) {
      onCompleteRef.current?.();
      const closeButton = document.querySelector(
        "[data-dialog-close]",
      ) as HTMLButtonElement;
      if (closeButton) {
        closeButton.click();
      }
    }
  }, [isCompleted, countdown]);

  return { isCompleted, setIsCompleted, countdown };
}

function PaymentCompletedState({
  method,
  countdown,
  onClose,
}: {
  method: string;
  countdown: number;
  onClose?: () => void;
}) {
  const { logout } = useAuth();

  const handleClose = () => {
    onClose?.();
    logout();
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Payment completed</DialogTitle>
        <DialogDescription>
          Your {method} payment has been processed successfully.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col items-center justify-center gap-4 py-6">
        <div className="text-lg font-semibold text-green-600">
          ✅ Payment Completed
        </div>
      </div>
      <DialogFooter className="pt-4">
        <DialogClose asChild>
          <Button className="w-full" data-dialog-close onClick={handleClose}>
            Done ({countdown}s)
          </Button>
        </DialogClose>
      </DialogFooter>
    </div>
  );
}

function createPurchasePayload(
  selectedItems: { id: string; quantity: number }[],
  paymentType: string,
  additionalData?: Record<string, unknown>,
) {
  return {
    items: selectedItems.map((item) => ({
      id: item.id,
      amount: item.quantity,
    })),
    payment_type: paymentType,
    ...additionalData,
  };
}

function CashForm({ onComplete, amountInCents }: PaymentFormProps) {
  const { selectedItems } = useSelectedItems();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const { isCompleted, setIsCompleted, countdown } = usePaymentCompletion(
    false,
    () => {
      if (paymentResult) {
        onComplete?.(paymentResult);
      }
    },
  );

  const isBalanceTopUp = amountInCents !== undefined;
  const totalInCents = isBalanceTopUp
    ? amountInCents
    : selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalInEuros = (totalInCents / 100).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let payload;
      if (isBalanceTopUp) {
        payload = {
          amount: amountInCents,
          payment_type: "cash",
        };
      } else {
        payload = createPurchasePayload(selectedItems, "cash");
      }

      const response = await fetch(`${config.apiBaseUrl}/api/v1/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = response.statusText;

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {}

        throw new Error(`Failed to create purchase: ${errorMessage}`);
      }

      const result = await response.json();
      setPaymentResult({ method: "cash", data: result });
      setIsCompleted(true);
    } catch (error) {
      console.error("Error creating cash purchase:", error);
      setError(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return <PaymentCompletedState method="cash" countdown={countdown} />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Cash payment</DialogTitle>
        <DialogDescription>
          {isBalanceTopUp
            ? `Please put €${totalInEuros} into the register.`
            : `Please put the cash (€${totalInEuros}) into the register.`}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="flex flex-col items-center justify-center gap-4 py-2">
          <div className="text-sm text-red-500 text-center">{error}</div>
        </div>
      )}

      <DialogFooter className="pt-4">
        <DialogClose asChild>
          <Button variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
        </DialogClose>

        {error ? (
          <Button onClick={() => setError(null)}>Try Again</Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Done"}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}

function CardForm({ onComplete, amountInCents }: PaymentFormProps) {
  const { selectedItems } = useSelectedItems();
  const { settings } = useSettings();
  const { isConnected, lastEvent } = useSSE();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientTransactionId, setClientTransactionId] = useState<string | null>(
    null,
  );
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<unknown>(null);

  const { isCompleted, setIsCompleted, countdown } = usePaymentCompletion(
    false,
    () => {
      if (paymentResult) {
        onComplete?.(paymentResult);
      }
    },
  );

  const defaultReaderId = settings?.default_reader_id;

  useEffect(() => {
    if (!defaultReaderId) {
      setError("No card reader configured. Please contact an administrator.");
    }
  }, [defaultReaderId]);

  // automatically start payment when dialog opens
  useEffect(() => {
    if (
      defaultReaderId &&
      isConnected &&
      status === "idle" &&
      !isProcessing &&
      !error
    ) {
      startPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultReaderId, isConnected]);

  useEffect(() => {
    if (lastEvent?.type === "transaction_update" && clientTransactionId) {
      const data = lastEvent.data.transaction_payload;
      if (!data) return;
      const { client_transaction_id, transaction_status } = data;

      if (client_transaction_id === clientTransactionId) {
        setStatus(transaction_status);

        if (transaction_status === "successful") {
          setPaymentResult({ status: "successful", client_transaction_id });
          setIsCompleted(true);
        } else if (
          transaction_status === "failed" ||
          transaction_status === "cancelled"
        ) {
          setIsProcessing(false);
          setError(`Payment ${transaction_status}`);
        }
      }
    }
  }, [lastEvent, clientTransactionId, setIsCompleted]);

  const startPayment = async () => {
    if (!defaultReaderId) {
      setError("No card reader configured. Please contact an administrator.");
      return;
    }

    if (!isConnected) {
      setError("Payment system not connected. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStatus("starting");

    try {
      let purchaseData;
      const isBalanceTopUp = amountInCents !== undefined;

      if (isBalanceTopUp) {
        purchaseData = {
          amount: amountInCents,
          payment_type: "card",
          reader_id: defaultReaderId,
        };
      } else {
        purchaseData = createPurchasePayload(selectedItems, "card", {
          reader_id: defaultReaderId,
        });
      }

      const response = await fetch(`${config.apiBaseUrl}/api/v1/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = response.statusText;

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {}

        throw new Error(`Failed to create purchase: ${errorMessage}`);
      }

      const result = await response.json();
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

  const terminatePayment = async () => {
    try {
      await fetch(
        `${config.apiBaseUrl}/api/payment/v1/readers/terminate/${defaultReaderId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );
    } catch (err) {
      console.error("Failed to terminate payment:", err);
    }
  };

  const getStatusMessage = () => {
    const messages = {
      starting: "Initializing payment...",
      pending: "Please complete payment on the card reader",
      successful: "Payment successful!",
      failed: "Payment failed",
      cancelled: "Payment cancelled",
    };
    return (
      messages[status as keyof typeof messages] || "Ready to start payment"
    );
  };

  if (isCompleted) {
    return <PaymentCompletedState method="card" countdown={countdown} />;
  }

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
          <Button
            variant="outline"
            onClick={() => {
              if (isProcessing || status === "pending") {
                terminatePayment();
              }
            }}
          >
            Cancel
          </Button>
        </DialogClose>

        {!isProcessing && status === "idle" && (
          <Button type="submit" disabled={!isConnected || !defaultReaderId}>
            Start Payment
          </Button>
        )}

        {error && defaultReaderId && (
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

function BalanceForm({ onComplete }: PaymentFormProps) {
  const { selectedItems, totalInEuros } = useSelectedItems();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<unknown>(null);

  const { isCompleted, setIsCompleted, countdown } = usePaymentCompletion(
    false,
    () => {
      if (paymentResult) {
        onComplete?.(paymentResult);
      }
    },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = createPurchasePayload(selectedItems, "balance");
      const response = await fetch(`${config.apiBaseUrl}/api/v1/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Payment failed: ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {}

        throw new Error(errorMessage);
      }

      const result = await response.json();
      setPaymentResult({ method: "balance", data: result });
      setIsCompleted(true);
    } catch (error) {
      console.error("Error creating balance purchase:", error);
      setError(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return <PaymentCompletedState method="balance" countdown={countdown} />;
  }

  return (
    <form onSubmit={handleSubmit}>
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

      {error && (
        <div className="flex flex-col items-center justify-center gap-4 py-2">
          <div className="text-sm text-red-500 text-center">{error}</div>
        </div>
      )}

      <DialogFooter className="pt-4">
        <DialogClose asChild>
          <Button variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
        </DialogClose>

        {error ? (
          <Button onClick={() => setError(null)}>Try Again</Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Pay"}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}

export function PaymentDialog({
  method,
  trigger,
  amountInCents,
  onComplete,
}: PaymentDialogProps) {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isSelectingMethod, setIsSelectingMethod] = useState(false);
  const [selected, setSelected] = useState<KnownMethod | undefined>(
    (method as KnownMethod) ?? undefined,
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

  const isCardAvailable = !!settings?.default_reader_id;
  const isBalanceTopUp = amountInCents !== undefined;

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setIsSelectingMethod(false);
    }

    if (open) {
      setIsSelectingMethod(false);
    }

    setIsOpen(open);
  };

  const handleSelectMethod = (nextMethod: KnownMethod) => {
    if (isSelectingMethod) return;
    setIsSelectingMethod(true);
    setSelected(nextMethod);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent
        className="sm:max-w-[480px]"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {!selected ? (
          <div>
            <DialogHeader>
              <DialogTitle>Select payment method</DialogTitle>
              <DialogDescription>
                Choose how to accept payment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <Button
                onClick={() => handleSelectMethod("cash")}
                disabled={isSelectingMethod}
              >
                Cash
              </Button>
              <Button
                onClick={() => handleSelectMethod("card")}
                disabled={!isCardAvailable || isSelectingMethod}
              >
                Card
                {!isCardAvailable && (
                  <span className="ml-2 text-xs opacity-70">
                    (No reader configured)
                  </span>
                )}
              </Button>
              {!isBalanceTopUp && (
                <Button
                  onClick={() => handleSelectMethod("balance")}
                  disabled={isSelectingMethod}
                >
                  Balance
                </Button>
              )}
            </div>
            {!isCardAvailable && (
              <div className="text-sm text-muted-foreground text-center px-4 pb-2">
                Card payments are unavailable. Please configure a default card
                reader in the admin settings.
              </div>
            )}
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
                amountInCents={amountInCents}
                onComplete={(data) => onComplete?.({ method: "cash", data })}
              />
            )}
            {selected === "card" && (
              <CardForm
                amountInCents={amountInCents}
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
