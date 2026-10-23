import { createCrudController } from "@/lib/controllers/crud-controller";
import { ApiError } from "@/lib/http/api-error";
import { db } from "@/lib/db/pool";
import { resources } from "@/lib/resources/definitions";

export const transactionsController = createCrudController(resources.transactions, async (fields, context) => {
  const existing = context.operation === "update" && context.id
    ? (await db.query<{ type: string; category_id: string }>(
      "SELECT type, category_id FROM transactions WHERE id = $1",
      [context.id],
    )).rows[0]
    : undefined;

  if (context.operation === "update" && !existing) return;

  const type = fields.type ?? existing?.type;
  const categoryId = fields.category_id ?? existing?.category_id;
  if (typeof type !== "string" || (typeof categoryId !== "string" && typeof categoryId !== "number")) return;

  const category = await db.query<{ type: string; default_amount: string | null }>(
    "SELECT type, default_amount FROM transaction_categories WHERE id = $1",
    [categoryId],
  );
  if (!category.rows[0]) throw new ApiError("Selected category does not exist", 400);
  if (category.rows[0].type !== type) {
    throw new ApiError("Category type must match the transaction type", 400);
  }

  const categoryChanged = context.operation === "create"
    || String(categoryId) !== String(existing?.category_id);
  if (fields.amount === undefined && categoryChanged) {
    const defaultAmount = category.rows[0].default_amount;
    if (defaultAmount === null) {
      throw new ApiError("Enter an amount or set a default amount for this category", 400);
    }
    fields.amount = defaultAmount;
  }
});
