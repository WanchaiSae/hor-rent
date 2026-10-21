import type { DatabaseId, Decimal, Timestamp } from "./shared";
import type { TransactionType } from "./transaction-category";

export interface Transaction {
  id: DatabaseId;
  dormitory_id: DatabaseId;
  room_id: DatabaseId | null;
  contract_id: DatabaseId | null;
  category_id: DatabaseId;
  type: TransactionType;
  amount: Decimal;
  transaction_date: Timestamp;
  payment_status: string;
  paid_at: Timestamp | null;
  note: string | null;
  created_at: Timestamp;
}
