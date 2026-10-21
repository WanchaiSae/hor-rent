export type FieldType = "text" | "id" | "integer" | "decimal" | "boolean" | "date" | "timestamp" | "enum";

export interface FieldDefinition {
  column: string;
  type: FieldType;
  required?: boolean;
  nullable?: boolean;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  values?: readonly string[];
}

export interface ResourceDefinition {
  table: string;
  idColumn?: string;
  fields: Record<string, FieldDefinition>;
  orderBy?: string;
  listFrom?: string;
  listFields?: string;
  listFilter?: { parameter: string; column: string };
  itemFrom?: string;
  itemFields?: string;
  itemIdColumn?: string;
}
