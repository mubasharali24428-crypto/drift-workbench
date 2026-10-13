import { AGENT_PRICING } from "@/content/agents-pricing";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(AGENT_PRICING, null, 2) + "\n", {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
