import { db } from "@/lib/db/pool";
import { errorResponse } from "@/lib/http/api-error";

export async function GET() {
  try {
    await db.query("SELECT 1");
    return Response.json({ status: "ok", database: "connected" });
  } catch (error) {
    return errorResponse(error);
  }
}
