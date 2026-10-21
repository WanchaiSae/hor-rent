import { createCrudController } from "@/lib/controllers/crud-controller";
import { resources } from "@/lib/resources/definitions";

const controller = createCrudController(resources.transactionCategories);
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  return controller.get((await params).id);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  return controller.update((await params).id, request);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  return controller.remove((await params).id);
}
