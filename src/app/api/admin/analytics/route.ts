import { z } from "zod";
import { analyticsOverview, RANGES, type Range } from "@/server/analytics";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

const ranges = Object.keys(RANGES) as [Range, ...Range[]];

/** Analítica para la sala de admin. `?dias=1|7|30|90`. */
export async function GET(request: Request) {
  const dias = z.enum(ranges).catch("30").parse(new URL(request.url).searchParams.get("dias") ?? "30");
  return endpoint({
    scope: "admin-analytics",
    max: 60,
    need: "admin",
    run: async () => {
      const admins = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      return analyticsOverview(dias, admins);
    },
  })(request);
}
