# Drift Workbench — MCP Server & macOS Desktop App

Two surfaces, one engine:

- **`@drift-workbench/mcp-server`** — a free MCP (Model Context Protocol) server exposing **20
  network-diagnostic tools** to any AI coding harness. This is what the npm package ships.
- **Drift Workbench desktop app** — a double-clickable macOS **menu-bar app** wrapping the same engine
  (documented lower in this file).

## MCP Server — 20 network-diagnostic tools for AI coding agents

Wire Drift Workbench into any MCP-compatible harness as a **free** stdio server. Runtime needs
Node ≥ 18 **plus** Python 3.10+ and `curl` (the server shells out to the bundled Drift Workbench
engine — nothing is installed system-wide).

**Install matrix**

| Harness | One-liner / config |
|---|---|
| **Any npx-compatible harness** | `npx -y @drift-workbench/mcp-server` |
| **Claude Code** | `claude mcp add netmax -- npx -y @drift-workbench/mcp-server` |
| **Codex CLI** | `~/.codex/config.toml` → `[mcp_servers.netmax]` with `command = "npx"`, `args = ["-y", "@drift-workbench/mcp-server"]` |
| **Cursor** | `~/.cursor/mcp.json` → add `netmax` to `mcpServers` |
| **Gemini / Antigravity** | `~/.gemini/config/mcp_config.json` → add `netmax` to `mcpServers` |
| **LM Studio** | `~/.lmstudio/mcp.json` → add `netmax` to `mcpServers` |
| **Claude Desktop** | `claude_desktop_config.json` → add `netmax` to `mcpServers` |
| **DSH (DeepSeek)** | `cordis.patch.yml` → insert `mcp-netmax` client plugin |
| **VS Code (Continue.dev)** | `~/.continue/config.json` → add `netmax` to `mcpServers` |

**Desktop app (macOS 13+, universal build):** download the DMG from the
[GitHub releases page](https://github.com/mubasharali24428-crypto/netmax/releases).

Tools: `measure_speed`, `dns_ranking`, `bufferbloat`, `upload_speed`, `packet_loss`,
`jitter`, `wifi_info`, `download_file`, `eco_bloat`, `full_diagnostics`,
`diagnostic_summary`, `boost`, `parallel_diagnostics`, `session_info`,
`strict_limit`, `fleet_drift_workbench`, `ai_analyze`, `list_analyses`,
`evidence_export`, `policy_bound_workflow`, `path_trace`, `http_timing`,
`captive_portal_check`, `ipv6_check`, `mtu_probe`, `network_context`. Full detail:
[`MCP-README.md`](./MCP-README.md).

Run standalone: `node netmax-mcp-server.mjs`

---

## Desktop app (macOS menu-bar app)

A double-clickable macOS **menu-bar app** wrapping today's Drift Workbench engine:
Swift shell (`SwiftNetMax/`) → Python bridge (`bridge/engine_bridge.py`) → engine modules (`netmax*.py`, `netmetrics.py`).

Status: **Phase 0** — signed shell + honest-limits onboarding. Ad-hoc signed only; build, verify, and distribution notes live in
[BUILD-NOTES.md](https://github.com/mubasharali24428-crypto/netmax/blob/main/desktop/docs/BUILD-NOTES.md).

## Python interpreter override (`NETMAX_PYTHON`)

All tooling defaults to the system `python3` but honors `NETMAX_PYTHON`:

- **Scripts** — `scripts/verify_phase0.sh` resolves
  `PY="${NETMAX_PYTHON:-python3}"`; `build_app.sh` invokes no
  Python directly.
- **App runtime** — the Swift shell (`EngineClient.swift`) also reads
  `NETMAX_PYTHON`, falling back to the system `python3`.
- **Usage:** `NETMAX_PYTHON=/path/to/python ./scripts/verify_phase0.sh`


## Further reading

- [MCP-README.md](./MCP-README.md) — full tool reference (ships in the npm package).
- [BUILD-NOTES.md](https://github.com/mubasharali24428-crypto/netmax/blob/main/desktop/docs/BUILD-NOTES.md) —
  internal build, verify-gate, and distribution notes (repo only, not shipped in npm).
