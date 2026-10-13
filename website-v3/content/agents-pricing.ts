import { PRICING, READOUT } from "@/content/copy";
import { SITE } from "@/lib/site";

// One source for /agents/pricing (page + JSON-LD) and /agents/pricing.json, built only from
// wording already approved in copy.ts. It lists what exists today: no license-key mechanics
// (not shipped in the app yet), no feature list beyond the approved Pricing points.
export type Plan = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly billing: "free" | "trial" | "one-time";
  readonly summary: string;
  readonly includes: readonly string[];
  readonly install?: string;
  readonly purchase?: { readonly method: string; readonly url: string };
};

const [platform, oneTime, evidence, trial] = PRICING.points;

export const AGENT_PRICING = {
  schema: "drift-workbench.pricing.v1",
  product: {
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    docs: `${SITE.url}/docs`,
  },
  status: PRICING.sub,
  currency: "USD",
  plans: [
    {
      id: "mcp-server",
      name: "MCP server",
      price: 0,
      billing: "free",
      summary: PRICING.mcpNote,
      includes: READOUT.map((r) => `${r.value} ${r.label}`),
      install: SITE.installCommand,
    },
    {
      id: "desktop-trial",
      name: "Desktop app trial",
      price: 0,
      billing: "trial",
      summary: trial,
      includes: [platform],
    },
    {
      id: "founding-license",
      name: PRICING.name,
      price: Number(PRICING.price.slice(1)),
      billing: "one-time",
      summary: oneTime,
      includes: [platform, evidence],
      purchase: { method: "Gumroad checkout, completed by a person", url: SITE.buyUrl },
    },
  ] satisfies readonly Plan[],
  agent_payments: {
    supported: false,
    note: "Checkout is a human purchase on Gumroad. There is no pay-per-call endpoint.",
  },
} as const;

export const AGENTS_PRICING_PATH = "/agents/pricing";
export const AGENTS_PRICING_JSON_PATH = "/agents/pricing.json";
export const AGENTS_PRICING_META = {
  title: "Drift Workbench pricing in machine-readable form",
  description:
    "The Drift Workbench plans as a page and as JSON: the free MCP server, the 14-day desktop trial, and the $29 Founding License.",
  heading: "Pricing, readable by agents.",
  sub: "The same plans as the pricing section, as this page and as JSON.",
} as const;
