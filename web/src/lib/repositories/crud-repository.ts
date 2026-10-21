import { db } from "@/lib/db/pool";
import type { ResourceDefinition } from "@/lib/resources/types";

export type DatabaseRow = Record<string, unknown>;
export type DatabaseFields = Record<string, unknown>;

export class CrudRepository {
  constructor(private readonly resource: ResourceDefinition) {}

  async list(options: { limit: number; offset: number; filter?: string }): Promise<DatabaseRow[]> {
    const from = this.resource.listFrom ?? quote(this.resource.table);
    const select = this.resource.listFields ?? "*";
    const where = options.filter && this.resource.listFilter
      ? `WHERE ${this.resource.listFilter.column} = $1`
      : "";
    const values: unknown[] = options.filter && this.resource.listFilter ? [options.filter] : [];
    values.push(options.limit, options.offset);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;
    const { rows } = await db.query<DatabaseRow>(
      `SELECT ${select} FROM ${from} ${where}
       ORDER BY ${this.resource.orderBy ?? "id"}
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      values,
    );
    return rows;
  }

  async findById(id: string): Promise<DatabaseRow | null> {
    const idColumn = this.resource.idColumn ?? "id";
    const from = this.resource.itemFrom ?? quote(this.resource.table);
    const fields = this.resource.itemFields ?? "*";
    const whereColumn = this.resource.itemIdColumn ?? quote(idColumn);
    const { rows } = await db.query<DatabaseRow>(
      `SELECT ${fields} FROM ${from} WHERE ${whereColumn} = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async create(fields: DatabaseFields): Promise<DatabaseRow> {
    const entries = Object.entries(fields);
    const columns = entries.map(([column]) => quote(column));
    const placeholders = entries.map((_, index) => `$${index + 1}`);
    const values = entries.map(([, value]) => value);
    const returningId = quote(this.resource.idColumn ?? "id");
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO ${quote(this.resource.table)} (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       RETURNING ${returningId} AS id`,
      values,
    );
    const created = await this.findById(rows[0].id);
    if (!created) throw new Error("Inserted row could not be read back");
    return created;
  }

  async update(id: string, fields: DatabaseFields): Promise<DatabaseRow | null> {
    const entries = Object.entries(fields);
    const idColumn = this.resource.idColumn ?? "id";
    const assignments = entries.map(([column], index) => `${quote(column)} = $${index + 1}`);
    const values = entries.map(([, value]) => value);
    values.push(id);
    const { rows } = await db.query<{ id: string }>(
      `UPDATE ${quote(this.resource.table)}
       SET ${assignments.join(", ")}
       WHERE ${quote(idColumn)} = $${values.length}
       RETURNING ${quote(idColumn)} AS id`,
      values,
    );
    return rows[0] ? this.findById(rows[0].id) : null;
  }

  async delete(id: string): Promise<boolean> {
    const idColumn = this.resource.idColumn ?? "id";
    const { rowCount } = await db.query(
      `DELETE FROM ${quote(this.resource.table)} WHERE ${quote(idColumn)} = $1`,
      [id],
    );
    return rowCount === 1;
  }
}

function quote(identifier: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}
