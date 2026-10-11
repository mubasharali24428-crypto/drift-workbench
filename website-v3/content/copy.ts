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
// Five lines differ from the inputs file by one word each, because the original
// wording used banned marketing words (see CLAUDE.md): eco_bloat and
// diagnostic_summary lost "Quick"; boost has "multi-stream" in place of "turbo";
// upload_speed and parallel_diagnostics have "throughput" in place of "speed".
export const TOOLS = [
  { name: "measure_speed", description: "Download throughput, baseline vs multi-stream" },
  { name: "upload_speed", description: "Upload throughput in Mbps" },
  { name: "download_file", description: "Multi-stream accelerated file download" },
  {
    name: "parallel_diagnostics",
    description: "Throughput, DNS, bloat and WiFi in one concurrent call",
  },
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

export const HOW = {
  heading: "Install once. Your agent does the rest.",
  steps: [
    {
      title: "Install",
      body: "One command registers the server with your agent.",
      code: "npx -y @drift-workbench/mcp-server",
    },
    { title: "Baseline", body: "20 probes set what normal looks like." },
    { title: "Prove", body: "3 consecutive breaches confirm drift." },
  ],
} as const;

export const DEEP_DIVE = {
  heading: "From symptom to evidence.",
  steps: [
    {
      title: "Detect",
      body: "Probes run on your machine and compare each result with the baseline. Three consecutive breaches confirm drift.",
    },
    {
      title: "Explain",
      body: "Your agent reads the measurements and names the cause. In the illustrated session below, latency rises under load while packet loss stays clean.",
    },
    {
      title: "Prove",
      body: "8 of 8 fault tests returned honest results, with zero fabricated values. A failed probe reports the failure.",
    },
    {
      title: "Export",
      body: "A timestamped evidence report with measured values only, as JSON from the MCP server or from the macOS app.",
    },
  ],
} as const;

export const TRANSCRIPT = {
  heading: "What the session looks like.",
  label: "Illustrated flow",
  note: "The layout is illustrated. The measured values come from the one local run shown above.",
  lines: [
    { role: "user", text: "why did my agent stall?" },
    { role: "agent", text: "calling packet_loss, then bufferbloat" },
    { role: "tool", text: "packet_loss: target=1.1.1.1 count=10 loss=0.0%" },
    { role: "tool", text: "bufferbloat: idle=63.8 ms loaded=+542.6 ms grade=F" },
    {
      role: "agent",
      text: "latency rises under load; packet loss is not the cause. Exporting the evidence.",
    },
    { role: "tool", text: "evidence_export: timestamped report, measured values only" },
  ],
} as const;

export const METRICS = {
  heading: "Measured, not marketed.",
  sub: "Results from our own QA runs. Not benchmarks against other tools.",
  items: [
    { value: "50/50", label: "parallel probes completed clean" },
    { value: "+0.1 MB", label: "memory growth across a 100-probe soak" },
    { value: "8/8", label: "fault tests honest, zero fabricated values" },
    { value: "16/16", label: "Linux unit tests passing" },
  ],
} as const;

export const PRICING = {
  heading: "One license. Founding cohort.",
  sub: "Drift Workbench is in private preview. The desktop app is open to a founding cohort.",
  price: "$29",
  name: "Founding License",
  points: [
    "Desktop app for macOS 13+, Apple Silicon and Intel",
    "One-time payment",
    "Timestamped evidence reports",
    "14-day trial, no account",
  ],
  cta: "Get the Founding License",
  mcpNote: "The MCP server is free.",
} as const;

export const FAQ = {
  heading: "Questions, answered.",
  items: [
    {
      q: "Does it phone home?",
      a: "No. Measurements stay on your machine, with zero telemetry. The only network call is one trial activation against the trial registry.",
    },
    {
      q: "Which platforms are supported?",
      a: "The MCP server runs anywhere Node runs. The desktop app requires macOS 13+. Windows probe parsers are validated on real captures; the full Windows suite is pending.",
    },
    {
      q: "What counts as drift?",
      a: "Drift is confirmed after 3 consecutive breaches: median latency more than 20% over baseline, or failure rate above 1%.",
    },
    {
      q: "How does the trial work?",
      a: "Activation is hardware-bound (SHA-256 of machine UUID) and server-verified, issues a 14-day token, and fails closed. Virtual machines are denied.",
    },
    {
      q: "Is the launch open?",
      a: "No. This is a private preview for a founding cohort. Public launch is paused.",
    },
  ],
} as const;

export const FINAL_CTA = {
  heading: "Give your agent a way to see the network.",
  sub: "One command. Free MCP server. Zero telemetry.",
} as const;

export const FOOTER = {
  note: "Private preview. Public launch is paused.",
} as const;
