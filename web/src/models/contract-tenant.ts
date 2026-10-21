import type { DatabaseId, DateOnly } from "./shared";

export interface ContractTenant {
  id: DatabaseId;
  contract_id: DatabaseId;
  tenant_id: DatabaseId;
  is_primary: boolean;
  move_in_date: DateOnly | null;
  move_out_date: DateOnly | null;
}
