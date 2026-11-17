import { z } from "zod";
import { refreshPublicPages } from "@/server/http";
import { adminReports, resolveReports } from "@/server/reports";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

export const GET = endpoint({
  scope: "admin-reportes",
  max: 60,
  need: "admin",
  run: async () => ({ reports: await adminReports() }),
});

export const POST = endpoint({
  scope: "admin-reportes-accion",
  max: 60,
  need: "admin",
  schema: z.object({ listingId: z.string().min(1).max(120), action: z.enum(["descartar", "retirar"]) }),
  run: async ({ input }) => {
    const result = await resolveReports(input.listingId, input.action);
    refreshPublicPages();
    return result;
  },
});
