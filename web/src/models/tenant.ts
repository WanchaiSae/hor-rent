import type { DatabaseId, Timestamp } from "./shared";

export interface Tenant {
  id: DatabaseId;
  citizen_id: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  emergency_contact: string | null;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
