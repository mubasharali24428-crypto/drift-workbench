// Releases of the npm package only. Every entry traces to RELEASE-NOTES.md and was checked
// against the published package (registry file counts, the shipped engine, publish dates from
// `npm view @drift-workbench/mcp-server time`). Desktop-app items are left out: no DMG for these
// versions is verified. Backticks mark inline code.
export const CHANGELOG = {
  metaTitle: "Drift Workbench changelog: MCP server releases",
  metaDescription:
    "What changed in each release of the Drift Workbench MCP server on npm, with the publish dates from the registry.",
  heading: "Changelog",
  sub: "Releases of `@drift-workbench/mcp-server`. Only what shipped in the published package.",
  releases: [
    {
      version: "1.0.8",
      date: "2026-10-12",
      sections: [
        {
          title: "Fixed",
          items: [
            "`evidence_export` works. The tool calls the engine's `export-evidence` command, which the 1.0.7 package did not contain. The package now ships that command and the modules it needs.",
            "The shipped engine is synced with the project's canonical modules. Five were missing from 1.0.7: `netmax_platform`, `netmax_export_manifest`, `netmax_throttle`, `netmax_wifievents` and `netmax_eventstore`.",
          ],
        },
        {
          title: "Added",
          items: [
            "A Windows probe layer. `netmax_platform` adds per-OS ping commands and output parsers, which the engine's ping-based probes use. The parsers are validated against a real Windows 11 capture (0.0% loss, 3.0 ms jitter). The full Windows suite has not been run yet.",
          ],
        },
        {
          title: "Docs",
          items: ["The package README uses the Drift Workbench name and lists all 20 tools."],
        },
      ],
    },
    {
      version: "1.0.7",
      date: "2026-10-10",
      sections: [
        {
          title: "Release",
          items: [
            "First release under the name `@drift-workbench/mcp-server`. Earlier releases were published as `@netmax/mcp-server`.",
          ],
        },
        {
          title: "Fixed",
          items: [
            "Long download tests no longer end early. Downloads now run back-to-back chunks until the requested duration, and a brief endpoint error (429, 403 or TLS reset) pauses and retries instead of aborting the run.",
          ],
        },
        {
          title: "Added",
          items: [
            "A `limit` mode in the bundled engine that holds a download at a fixed rate, with a closed-loop governor, a hard pace ceiling of 1.5 times the target and a stability line in the report. It is not an MCP tool: `strict_limit` uses kernel-level shaping.",
          ],
        },
        {
          title: "Known issue",
          items: [
            "`evidence_export` failed because the package lacked the engine's `export-evidence` command. Fixed in 1.0.8.",
          ],
        },
      ],
    },
  ],
} as const;
