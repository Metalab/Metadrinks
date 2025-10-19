export interface Purchase {
  id: string;
  items?: PurchaseItem[];
  payment_type: "cash" | "card" | "balance";
  status: "cancelled" | "failed" | "pending" | "successful";
  client_transaction_id?: string;
  final_cost: number;
  refund_amount?: number;
  created_at: string;
  created_by: string;
}

export interface PurchaseItem {
  id: string;
  product_name: string;
  product_variant?: string;
  volume: number;
  price: number;
  amount: number;
}
