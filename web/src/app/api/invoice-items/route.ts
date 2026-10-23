import { invoiceItemsController } from "@/lib/controllers/invoice-items-controller";

export const GET = invoiceItemsController.list;
export const POST = invoiceItemsController.create;
