import type { DatabaseId, DateOnly, Decimal, Timestamp } from "./shared";

export interface Invoice {
  id: DatabaseId;
  dormitory_id: DatabaseId;
  contract_id: DatabaseId;
  invoice_number: string;
  invoice_date: DateOnly;
  due_date: DateOnly;
  period_start: DateOnly;
  period_end: DateOnly;
  subtotal: Decimal;
  tax: Decimal;
  total_amount: Decimal;
  status: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
