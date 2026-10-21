import type { DatabaseId, Decimal } from "./shared";

export interface InvoiceItem {
  id: DatabaseId;
  invoice_id: DatabaseId;
  description: string;
  quantity: Decimal;
  unit_price: Decimal;
  amount: Decimal;
  transaction_id: DatabaseId | null;
}
