import { createCrudController } from "@/lib/controllers/crud-controller";
import { ApiError } from "@/lib/http/api-error";
import { db } from "@/lib/db/pool";
import { resources } from "@/lib/resources/definitions";

const MAX_QUANTITY_CENTS = BigInt("9999999999"); // NUMERIC(10, 2)
const MAX_MONEY_CENTS = BigInt("999999999999"); // NUMERIC(12, 2)

export const invoiceItemsController = createCrudController(resources.invoiceItems, async (fields, context) => {
  const existing = context.operation === "update" && context.id
    ? (await db.query<{ quantity: string; unit_price: string }>(
      "SELECT quantity, unit_price FROM invoice_items WHERE id = $1",
      [context.id],
    )).rows[0]
    : undefined;

  // Let the CRUD controller return its normal 404 for an unknown update target.
  if (context.operation === "update" && !existing) return;

  const quantity = fields.quantity ?? existing?.quantity ?? "1";
  const unitPrice = fields.unit_price ?? existing?.unit_price;
  if (unitPrice === undefined) throw new ApiError("Unit price is required", 400);

  const quantityCents = toCents(quantity, "Quantity");
  const unitPriceCents = toCents(unitPrice, "Unit price");
  if (quantityCents < BigInt(1)) throw new ApiError("Quantity must be at least 0.01", 400);
  if (quantityCents > MAX_QUANTITY_CENTS) throw new ApiError("Quantity exceeds the supported maximum", 400);
  if (unitPriceCents > MAX_MONEY_CENTS) throw new ApiError("Unit price exceeds the supported maximum", 400);

  // Persist the same two-decimal values used by the calculation.
  if (fields.quantity !== undefined) fields.quantity = fromCents(quantityCents);
  if (fields.unit_price !== undefined) fields.unit_price = fromCents(unitPriceCents);

  const amountCents = (quantityCents * unitPriceCents + BigInt(50)) / BigInt(100);
  if (amountCents > MAX_MONEY_CENTS) throw new ApiError("Calculated amount exceeds the supported maximum", 400);
  fields.amount = fromCents(amountCents);
});

function toCents(value: unknown, label: string): bigint {
  const text = String(value);
  const match = /^(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) throw new ApiError(`${label} must be a non-negative decimal`, 400);

  const fraction = match[2] ?? "";
  const firstTwoDigits = fraction.slice(0, 2).padEnd(2, "0");
  let cents = BigInt(match[1]) * BigInt(100) + BigInt(firstTwoDigits || "0");
  if (fraction.length > 2 && fraction[2] >= "5") cents += BigInt(1);
  return cents;
}

function fromCents(value: bigint): string {
  return `${value / BigInt(100)}.${String(value % BigInt(100)).padStart(2, "0")}`;
}
