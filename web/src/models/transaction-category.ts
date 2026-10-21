import type { DatabaseId, Timestamp } from "./shared";

export type TransactionType = "income" | "expense";

export interface TransactionCategory {
  id: DatabaseId;
  name: string;
  type: TransactionType;
  is_system: boolean;
  created_at: Timestamp;
}
