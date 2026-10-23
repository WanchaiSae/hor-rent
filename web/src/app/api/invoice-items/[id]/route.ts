import { invoiceItemsController } from "@/lib/controllers/invoice-items-controller";
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  return invoiceItemsController.get((await params).id);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  return invoiceItemsController.update((await params).id, request);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  return invoiceItemsController.remove((await params).id);
}
