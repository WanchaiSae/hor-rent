import { transactionsController } from "@/lib/controllers/transactions-controller";
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  return transactionsController.get((await params).id);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  return transactionsController.update((await params).id, request);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  return transactionsController.remove((await params).id);
}
