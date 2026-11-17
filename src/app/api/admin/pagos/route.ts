import { adminPayments } from "@/server/payments";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

export const GET = endpoint({ scope: "admin-pagos", max: 60, need: "admin", run: () => adminPayments() });
