import { ApiError, errorResponse } from "@/lib/http/api-error";
import { CrudRepository, type DatabaseFields } from "@/lib/repositories/crud-repository";
import type { FieldDefinition, ResourceDefinition } from "@/lib/resources/types";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export interface CrudValidationContext {
  operation: "create" | "update";
  id?: string;
}

export function createCrudController(
  resource: ResourceDefinition,
  validate?: (fields: DatabaseFields, context: CrudValidationContext) => Promise<void>,
) {
  const repository = new CrudRepository(resource);

  return {
    async list(request: Request): Promise<Response> {
      try {
        const url = new URL(request.url);
        const limit = parsePageNumber(url.searchParams.get("limit"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const offset = parsePageNumber(url.searchParams.get("offset"), 0, Number.MAX_SAFE_INTEGER);
        const filter = resource.listFilter
          ? url.searchParams.get(resource.listFilter.parameter) ?? undefined
          : undefined;
        if (filter !== undefined) parseId(filter);
        const data = await repository.list({ limit, offset, filter });
        return Response.json({ data, pagination: { limit, offset } });
      } catch (error) {
        return handleError(error);
      }
    },

    async create(request: Request): Promise<Response> {
      try {
        const fields = await parseResourceFields(request, resource, true);
        await validate?.(fields, { operation: "create" });
        return Response.json({ data: await repository.create(fields) }, { status: 201 });
      } catch (error) {
        return handleError(error);
      }
    },

    async get(id: string): Promise<Response> {
      try {
        const row = await repository.findById(parseId(id));
        if (!row) throw new ApiError("Resource not found", 404);
        return Response.json({ data: row });
      } catch (error) {
        return handleError(error);
      }
    },

    async update(id: string, request: Request): Promise<Response> {
      try {
        const fields = await parseResourceFields(request, resource, false);
        if (Object.keys(fields).length === 0) {
          throw new ApiError("Provide at least one field to update", 400);
        }
        const recordId = parseId(id);
        await validate?.(fields, { operation: "update", id: recordId });
        const row = await repository.update(recordId, fields);
        if (!row) throw new ApiError("Resource not found", 404);
        return Response.json({ data: row });
      } catch (error) {
        return handleError(error);
      }
    },

    async remove(id: string): Promise<Response> {
      try {
        if (!(await repository.delete(parseId(id)))) {
          throw new ApiError("Resource not found", 404);
        }
        return new Response(null, { status: 204 });
      } catch (error) {
        return handleError(error);
      }
    },
  };
}

export async function parseResourceFields(
  request: Request,
  resource: ResourceDefinition,
  isCreate: boolean,
): Promise<DatabaseFields> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("Request body must be valid JSON", 400);
  }

  return validateResourceFields(body, resource, isCreate);
}

export function validateResourceFields(
  body: unknown,
  resource: ResourceDefinition,
  isCreate: boolean,
): DatabaseFields {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError("Request body must be a JSON object", 400);
  }

  const input = body as Record<string, unknown>;
  const unknownFields = Object.keys(input).filter((key) => !(key in resource.fields));
  if (unknownFields.length) {
    throw new ApiError(`Unknown field: ${unknownFields.join(", ")}`, 400);
  }

  const fields: DatabaseFields = {};
  for (const [key, definition] of Object.entries(resource.fields)) {
    const value = input[key];
    if (value === undefined) {
      if (isCreate && definition.required) {
        throw new ApiError(`${key} is required`, 400);
      }
      continue;
    }
    fields[definition.column] = validateField(key, value, definition);
  }
  return fields;
}

function validateField(key: string, value: unknown, definition: FieldDefinition): unknown {
  if (value === null) {
    if (definition.nullable) return null;
    throw new ApiError(`${key} cannot be null`, 400);
  }

  switch (definition.type) {
    case "text": {
      if (typeof value !== "string") break;
      const text = value.trim();
      if (!text && definition.nullable) return null;
      if (!text) throw new ApiError(`${key} cannot be empty`, 400);
      if (definition.maxLength && text.length > definition.maxLength) {
        throw new ApiError(`${key} must be at most ${definition.maxLength} characters`, 400);
      }
      return text;
    }
    case "enum":
      if (typeof value === "string" && definition.values?.includes(value)) return value;
      throw new ApiError(`${key} must be one of: ${definition.values?.join(", ")}`, 400);
    case "id": {
      const id = typeof value === "number" && Number.isSafeInteger(value) ? String(value) : value;
      if (typeof id === "string" && /^[1-9]\d*$/.test(id)) return id;
      break;
    }
    case "integer":
      if (typeof value === "number" && Number.isSafeInteger(value)) {
        return validateRange(key, value, definition);
      }
      break;
    case "decimal": {
      const decimal = typeof value === "number" && Number.isFinite(value) ? String(value) : value;
      if (typeof decimal === "string" && /^-?\d+(\.\d+)?$/.test(decimal)) {
        validateRange(key, Number(decimal), definition);
        return decimal;
      }
      break;
    }
    case "boolean":
      if (typeof value === "boolean") return value;
      break;
    case "date":
      if (typeof value === "string" && isValidDate(value)) return value;
      break;
    case "timestamp":
      if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString();
      break;
  }

  throw new ApiError(`${key} has an invalid value`, 400);
}

function validateRange(key: string, value: number, definition: FieldDefinition): undefined {
  if (definition.minimum !== undefined && value < definition.minimum) {
    throw new ApiError(`${key} must be at least ${definition.minimum}`, 400);
  }
  if (definition.maximum !== undefined && value > definition.maximum) {
    throw new ApiError(`${key} must be at most ${definition.maximum}`, 400);
  }
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseId(value: string): string {
  if (!/^[1-9]\d*$/.test(value)) throw new ApiError("id must be a positive integer", 400);
  return value;
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

export function handleError(error: unknown): Response {
  if (isPostgresError(error)) {
    if (error.code === "23505") return Response.json({ error: "A record with these values already exists" }, { status: 409 });
    if (error.code === "23503") return Response.json({ error: "Related record does not exist or is still in use" }, { status: 409 });
    if (["23502", "23514", "22P02", "22007"].includes(error.code)) {
      return Response.json({ error: "The supplied values violate a database constraint" }, { status: 400 });
    }
  }
  return errorResponse(error);
}

function isPostgresError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string";
}
