/** PostgreSQL BIGINT values are returned as strings by node-postgres. */
export type DatabaseId = string;

/** PostgreSQL NUMERIC values are returned as strings to preserve precision. */
export type Decimal = string;

/** PostgreSQL DATE values are returned as YYYY-MM-DD strings. */
export type DateOnly = string;

/** PostgreSQL TIMESTAMPTZ values are returned as JavaScript Date objects. */
export type Timestamp = Date;
