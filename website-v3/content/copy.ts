// All visible copy lives here. Claims limited to CLAUDE.md "Honest limits".
export const HERO = {
  eyebrow: "Drift Workbench · Private preview",
  headline: "Your AI agent is blind to the network.",
  headlineAccent: "Fix that.",
  subhead:
    "A 20-tool MCP server that measures throughput, bufferbloat, jitter, packet loss and DNS, so your coding agent can diagnose the network itself and export evidence.",
  secondaryLabel: "Get the desktop app — $29",
  terminalNote:
    "Real output from one run on one machine. The agent session layout is illustrative.",
};

export const NAV_LINKS = [
  { label: "Tools", href: "#tools" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
] as const;

export const READOUT = [
  { value: "20", label: "MCP tools" },
  { value: "0", label: "telemetry" },
  { value: "0", label: "accounts required" },
  { value: "100%", label: "local execution" },
] as const;

export const TOOLS_SECTION = {
  heading: "Twenty tools your agent can call.",
  sub: "One install registers all of them. Every name below is read from the MCP server source.",
};

// Names and one-liners from drift-workbench-phase4-inputs.txt, in that order.
// Three lines differ from the inputs file by one word each, because the original
// wording used banned marketing words (see CLAUDE.md): eco_bloat and
// diagnostic_summary lost "Quick"; boost has "multi-stream" in place of "turbo".
export const TOOLS = [
  { name: "measure_speed", description: "Download throughput, baseline vs multi-stream" },
  { name: "upload_speed", description: "Upload speed in Mbps" },
  { name: "download_file", description: "Multi-stream accelerated file download" },
  { name: "parallel_diagnostics", description: "Speed, DNS, bloat and WiFi in one concurrent call" },
  { name: "bufferbloat", description: "Latency under load, graded A+ to F" },
  { name: "eco_bloat", description: "Bufferbloat estimate using ~100KB of data" },
  { name: "jitter", description: "Packet arrival-time variance" },
  { name: "packet_loss", description: "Loss percentage" },
  { name: "dns_ranking", description: "Public DNS resolvers ranked by latency" },
  { name: "wifi_info", description: "Signal strength, noise, channel diagnostics" },
  { name: "boost", description: "Baseline vs multi-stream gain percentage" },
  { name: "strict_limit", description: "System-wide download ceiling, kernel-level (macOS)" },
  { name: "full_diagnostics", description: "The complete diagnostic suite in one call" },
  { name: "diagnostic_summary", description: "Network health overview" },
  { name: "ai_analyze", description: "AI-assisted diagnosis over your measurements" },
  { name: "session_info", description: "Server uptime and tool call counts" },
  { name: "list_analyses", description: "The AI analyses available to run" },
  { name: "evidence_export", description: "Timestamped evidence bundle (JSON)" },
  { name: "fleet_drift_workbench", description: "Fleet baselines and drift checks" },
  { name: "policy_bound_workflow", description: "Fixed, envelope-checked measurement sequences" },
] as const;
