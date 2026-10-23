import { transactionsController } from "@/lib/controllers/transactions-controller";

export const GET = transactionsController.list;
export const POST = transactionsController.create;
