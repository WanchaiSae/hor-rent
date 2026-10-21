import type { DatabaseId, Timestamp } from "./shared";

export interface Dormitory {
  id: DatabaseId;
  code: string;
  name: string;
  address: string | null;
  province: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type CreateDormitoryInput = Pick<Dormitory, "code" | "name"> &
  Partial<Pick<Dormitory, "address" | "province">>;
