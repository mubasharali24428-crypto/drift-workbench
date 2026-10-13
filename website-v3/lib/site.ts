// Single source for URLs and the install command. Verified against docs/product/landing-claims.md and npm.
export const SITE = {
  name: "Drift Workbench",
  // The apex domain. NEXT_PUBLIC_SITE_URL overrides it at build time (previews use their own alias).
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mubasharbuilds.com",
  description:
    "Local-first network diagnostics for AI coding agents. A 20-tool MCP server measures throughput, bufferbloat, jitter, packet loss and DNS, then exports timestamped evidence. No accounts, no telemetry.",
  installCommand: "npx -y @drift-workbench/mcp-server",
  npmUrl: "https://www.npmjs.com/package/@drift-workbench/mcp-server",
  // From `git remote get-url github` in the repo.
  repoUrl: "https://github.com/mubasharali24428-crypto/drift-workbench",
  // Verified with `npm view @drift-workbench/mcp-server version`.
  npmVersion: "1.0.8",
  licenseUrl: "https://github.com/mubasharali24428-crypto/drift-workbench/blob/main/LICENSE",
  // Existing Gumroad listing from landing-claims.md (NetMax Founding License). Confirm before launch.
  buyUrl: "https://mubasharali03.gumroad.com/l/yzkuez",
} as const;
