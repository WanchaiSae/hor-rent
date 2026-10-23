import { contractsController } from "@/lib/controllers/contracts-controller";
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  return contractsController.get((await params).id);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  return contractsController.update((await params).id, request);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  return contractsController.remove((await params).id);
}
