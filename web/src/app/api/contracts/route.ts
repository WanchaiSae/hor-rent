import { contractsController } from "@/lib/controllers/contracts-controller";

export const GET = contractsController.list;
export const POST = contractsController.create;
