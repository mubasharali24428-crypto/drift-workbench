// Single source for URLs and the install command. Verified against docs/product/landing-claims.md and npm.
export const SITE = {
  name: "Drift Workbench",
  // Placeholder until a custom domain exists; Cloudflare Pages default host form.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://drift-workbench.pages.dev",
  description:
    "Local-first network diagnostics for AI coding agents. A 20-tool MCP server measures throughput, bufferbloat, jitter, packet loss and DNS, then exports timestamped evidence. No accounts, no telemetry.",
  installCommand: "npx -y @drift-workbench/mcp-server",
  npmUrl: "https://www.npmjs.com/package/@drift-workbench/mcp-server",
  // From `git remote get-url github` in the repo.
  repoUrl: "https://github.com/mubasharali24428-crypto/netmax",
  // Verified with `npm view @drift-workbench/mcp-server version`.
  npmVersion: "1.0.7",
  licenseUrl: "https://github.com/mubasharali24428-crypto/netmax/blob/main/LICENSE",
  // Existing Gumroad listing from landing-claims.md (NetMax Founding License). Confirm before launch.
  buyUrl: "https://mubasharali03.gumroad.com/l/yzkuez",
} as const;
