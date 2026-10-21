import { createCrudController } from "@/lib/controllers/crud-controller";
import { resources } from "@/lib/resources/definitions";

const controller = createCrudController(resources.contracts);

export const GET = controller.list;
export const POST = controller.create;
