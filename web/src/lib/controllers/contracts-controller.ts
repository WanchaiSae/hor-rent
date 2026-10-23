import type { PoolClient } from "pg";
import { ApiError } from "@/lib/http/api-error";
import { db } from "@/lib/db/pool";
import { handleError, validateResourceFields } from "@/lib/controllers/crud-controller";
import { resources } from "@/lib/resources/definitions";
import type { DatabaseFields } from "@/lib/repositories/crud-repository";

const contractColumns = `
  c.*,
  r.room_number,
  COALESCE(contract_tenant_list.tenant_names, '—') AS tenant_names,
  primary_tenant.tenant_id
`;

const contractJoins = `
  JOIN rooms r ON r.id = c.room_id
  LEFT JOIN LATERAL (
    SELECT STRING_AGG(CONCAT(t.first_name, ' ', t.last_name), ', ' ORDER BY ct.is_primary DESC, ct.id) AS tenant_names
    FROM contract_tenants ct
    JOIN tenants t ON t.id = ct.tenant_id
    WHERE ct.contract_id = c.id
  ) contract_tenant_list ON TRUE
  LEFT JOIN LATERAL (
    SELECT ct.tenant_id
    FROM contract_tenants ct
    WHERE ct.contract_id = c.id
    ORDER BY ct.is_primary DESC, ct.id
    LIMIT 1
  ) primary_tenant ON TRUE
`;

const contractByIdQuery = `
  SELECT ${contractColumns}
  FROM contracts c
  ${contractJoins}
  WHERE c.id = $1
`;

export const contractsController = {
  async list(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const limit = parsePageNumber(url.searchParams.get("limit"), 50, 100);
      const offset = parsePageNumber(url.searchParams.get("offset"), 0, Number.MAX_SAFE_INTEGER);
      const { rows } = await db.query(
        `SELECT ${contractColumns}
         FROM contracts c
         ${contractJoins}
         ORDER BY c.created_at DESC, c.id DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      return Response.json({ data: rows, pagination: { limit, offset } });
    } catch (error) {
      return handleError(error);
    }
  },

  async get(id: string): Promise<Response> {
    try {
      const contractId = parseId(id);
      const result = await db.query(contractByIdQuery, [contractId]);
      if (!result.rows[0]) throw new ApiError("Resource not found", 404);
      return Response.json({ data: result.rows[0] });
    } catch (error) {
      return handleError(error);
    }
  },

  async create(request: Request): Promise<Response> {
    const client = await db.connect();
    try {
      const body = await readBody(request);
      const tenantId = parseId(body.tenantId);
      const contractInput = withoutTenantId(body);
      const fields = validateResourceFields(contractInput, resources.contracts, true);

      await client.query("BEGIN");
      await lockRooms(client, [String(fields.room_id)]);
      await assertRoomCanBeRented(client, fields);
      if (fields.status === "active") {
        await assertNoActiveContract(client, String(fields.room_id));
      }

      const contractId = await insertContract(client, fields);
      await setPrimaryTenant(client, contractId, tenantId);
      await syncRoomStatus(client, String(fields.room_id));
      const created = await client.query(contractByIdQuery, [contractId]);
      if (!created.rows[0]) throw new Error("Created contract could not be loaded");
      await client.query("COMMIT");
      return Response.json({ data: created.rows[0] }, { status: 201 });
    } catch (error) {
      await rollback(client);
      return handleError(error);
    } finally {
      client.release();
    }
  },

  async update(id: string, request: Request): Promise<Response> {
    const client = await db.connect();
    try {
      const contractId = parseId(id);
      const body = await readBody(request);
      const tenantId = body.tenantId === undefined ? undefined : parseId(body.tenantId);
      const contractInput = withoutTenantId(body);
      const fields = validateResourceFields(contractInput, resources.contracts, false);
      if (Object.keys(fields).length === 0 && tenantId === undefined) {
        throw new ApiError("Provide at least one field to update", 400);
      }

      await client.query("BEGIN");
      const current = await getContractForUpdate(client, contractId);
      if (!current) throw new ApiError("Resource not found", 404);

      const nextRoomId = String(fields.room_id ?? current.room_id);
      await lockRooms(client, [...new Set([String(current.room_id), nextRoomId])]);
      const nextFields = { ...current, ...fields };
      await assertRoomCanBeRented(client, nextFields, nextRoomId === String(current.room_id));
      if (nextFields.status === "active") {
        await assertNoActiveContract(client, nextRoomId, contractId);
      }

      if (Object.keys(fields).length > 0) {
        await updateContract(client, contractId, fields);
      }
      if (tenantId !== undefined) await setPrimaryTenant(client, contractId, tenantId);
      await syncRoomStatus(client, String(current.room_id));
      if (nextRoomId !== String(current.room_id)) await syncRoomStatus(client, nextRoomId);
      const updated = await client.query(contractByIdQuery, [contractId]);
      if (!updated.rows[0]) throw new Error("Updated contract could not be loaded");
      await client.query("COMMIT");
      return Response.json({ data: updated.rows[0] });
    } catch (error) {
      await rollback(client);
      return handleError(error);
    } finally {
      client.release();
    }
  },

  async remove(id: string): Promise<Response> {
    const client = await db.connect();
    try {
      const contractId = parseId(id);
      await client.query("BEGIN");
      const current = await getContractForUpdate(client, contractId);
      if (!current) throw new ApiError("Resource not found", 404);
      await lockRooms(client, [String(current.room_id)]);
      await client.query("DELETE FROM contracts WHERE id = $1", [contractId]);
      await syncRoomStatus(client, String(current.room_id));
      await client.query("COMMIT");
      return new Response(null, { status: 204 });
    } catch (error) {
      await rollback(client);
      return handleError(error);
    } finally {
      client.release();
    }
  },
};

async function readBody(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("Request body must be valid JSON", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError("Request body must be a JSON object", 400);
  }
  const input = body as Record<string, unknown>;
  const unknownFields = Object.keys(input).filter((key) => key !== "tenantId" && !(key in resources.contracts.fields));
  if (unknownFields.length > 0) throw new ApiError(`Unknown field: ${unknownFields.join(", ")}`, 400);
  return input;
}

function withoutTenantId(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([key]) => key !== "tenantId"));
}

function parseId(value: unknown): string {
  const id = typeof value === "number" && Number.isSafeInteger(value) ? String(value) : value;
  if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
    throw new ApiError("id must be a positive integer", 400);
  }
  return id;
}

function parsePageNumber(value: string | null, fallback: number, maximum: number): number {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) throw new ApiError("Pagination values must be non-negative integers", 400);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new ApiError(`Pagination value must be at most ${maximum}`, 400);
  }
  return parsed;
}

async function lockRooms(client: PoolClient, roomIds: string[]): Promise<void> {
  const ids = [...new Set(roomIds)].sort((left, right) => BigInt(left) < BigInt(right) ? -1 : 1);
  const result = await client.query("SELECT id FROM rooms WHERE id = ANY($1::bigint[]) ORDER BY id FOR UPDATE", [ids]);
  if (result.rowCount !== ids.length) throw new ApiError("Room not found", 404);
}

async function assertRoomCanBeRented(
  client: PoolClient,
  fields: DatabaseFields,
  allowOccupied = false,
): Promise<void> {
  const result = await client.query(
    "SELECT dormitory_id, status FROM rooms WHERE id = $1",
    [fields.room_id],
  );
  const room = result.rows[0];
  if (!room) throw new ApiError("Room not found", 404);
  if (String(room.dormitory_id) !== String(fields.dormitory_id)) {
    throw new ApiError("Selected room does not belong to the selected dormitory", 400);
  }
  if (room.status === "maintenance") throw new ApiError("Room is under maintenance", 409);
  if (room.status === "occupied" && !allowOccupied) throw new ApiError("Room is already occupied", 409);
}

async function assertNoActiveContract(client: PoolClient, roomId: string, exceptId?: string): Promise<void> {
  const result = await client.query(
    `SELECT 1 FROM contracts
     WHERE room_id = $1 AND status = 'active' AND ($2::bigint IS NULL OR id <> $2)
     LIMIT 1`,
    [roomId, exceptId ?? null],
  );
  if (result.rowCount) throw new ApiError("Room already has an active contract", 409);
}

async function insertContract(client: PoolClient, fields: DatabaseFields): Promise<string> {
  const entries = Object.entries(fields);
  const columns = entries.map(([column]) => `"${column}"`).join(", ");
  const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ");
  const result = await client.query<{ id: string }>(
    `INSERT INTO contracts (${columns}) VALUES (${placeholders}) RETURNING id`,
    entries.map(([, value]) => value),
  );
  return result.rows[0].id;
}

async function updateContract(client: PoolClient, id: string, fields: DatabaseFields): Promise<void> {
  const entries = Object.entries(fields);
  const assignments = [
    ...entries.map(([column], index) => `"${column}" = $${index + 1}`),
    "updated_at = NOW()",
  ].join(", ");
  await client.query(
    `UPDATE contracts SET ${assignments} WHERE id = $${entries.length + 1}`,
    [...entries.map(([, value]) => value), id],
  );
}

async function getContractForUpdate(client: PoolClient, id: string): Promise<DatabaseFields | null> {
  const result = await client.query<DatabaseFields>("SELECT * FROM contracts WHERE id = $1 FOR UPDATE", [id]);
  return result.rows[0] ?? null;
}

async function setPrimaryTenant(client: PoolClient, contractId: string, tenantId: string): Promise<void> {
  await client.query("UPDATE contract_tenants SET is_primary = FALSE WHERE contract_id = $1", [contractId]);
  await client.query(
    `INSERT INTO contract_tenants (contract_id, tenant_id, is_primary)
     VALUES ($1, $2, TRUE)
     ON CONFLICT (contract_id, tenant_id) DO UPDATE SET is_primary = TRUE`,
    [contractId, tenantId],
  );
}

async function syncRoomStatus(client: PoolClient, roomId: string): Promise<void> {
  await client.query(
    `UPDATE rooms r
     SET status = CASE
       WHEN EXISTS (SELECT 1 FROM contracts c WHERE c.room_id = r.id AND c.status = 'active') THEN 'occupied'
       WHEN r.status = 'occupied' THEN 'available'
       ELSE r.status
     END,
     updated_at = NOW()
     WHERE r.id = $1`,
    [roomId],
  );
}

async function rollback(client: PoolClient): Promise<void> {
  await client.query("ROLLBACK").catch(() => undefined);
}
