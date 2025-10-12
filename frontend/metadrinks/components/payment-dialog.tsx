"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onComplete?.({ amount: parseFloat(val || "0") });
      }}
    >
      <DialogHeader>
        <DialogTitle>Cash</DialogTitle>
        <DialogDescription>
          Please put the cash into the register.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Done</Button>
      </DialogFooter>
    </form>
  );
}

function CardForm({ onComplete }: { onComplete?: (d: any) => void }) {
  const [name, setName] = useState("");
  const [card, setCard] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onComplete?.({ name, card });
      }}
    >
      <DialogHeader>
        <DialogTitle>Card</DialogTitle>
        <DialogDescription>Enter card details.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-3">
          <Label htmlFor="card-name">Name</Label>
          <Input
            id="card-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="card-number">Card number</Label>
          <Input
            id="card-number"
            value={card}
            onChange={(e) => setCard(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Charge card</Button>
      </DialogFooter>
    </form>
  );
}

function BalanceForm({ onComplete }: { onComplete?: (d: any) => void }) {
  const [username, setUsername] = useState("");
  const [amt, setAmt] = useState<string>("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onComplete?.({ username, amount: parseFloat(amt || "0") });
      }}
    >
      <DialogHeader>
        <DialogTitle>Balance</DialogTitle>
        <DialogDescription>Charge from a user's balance.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-3">
          <Label htmlFor="balance-username">Username</Label>
          <Input
            id="balance-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="balance-amount">Amount</Label>
          <Input
            id="balance-amount"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            inputMode="decimal"
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Charge balance</Button>
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
                amount={amount}
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
