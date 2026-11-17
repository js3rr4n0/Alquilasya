import { createReport, reportInput } from "@/server/reports";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

/** Reportar un anuncio. Con o sin cuenta; una vez por persona y anuncio. */
export const POST = endpoint({
  scope: "reportes",
  max: 6,
  need: "anyone",
  schema: reportInput,
  run: async ({ request, user, input }) => {
    const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
    return createReport(input, user, ip);
  },
});
