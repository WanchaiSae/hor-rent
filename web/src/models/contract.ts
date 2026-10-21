import type { DatabaseId, DateOnly, Decimal, Timestamp } from "./shared";

export interface Contract {
  id: DatabaseId;
  dormitory_id: DatabaseId;
  room_id: DatabaseId;
  rental_period: "monthly" | "daily";
  contract_number: string;
  start_date: DateOnly;
  end_date: DateOnly | null;
  monthly_rent: Decimal;
  deposit_amount: Decimal;
  status: string;
  terms: string | null;
  check_in_date: DateOnly | null;
  check_out_date: DateOnly | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}
