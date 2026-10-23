BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS contract_tenants_contract_tenant_uidx
  ON contract_tenants (contract_id, tenant_id);

COMMIT;
