import { HERO } from "@/content/copy";
import { SITE } from "@/lib/site";

// Measured values from one run of the published @drift-workbench/mcp-server@1.0.8
// on one machine (2026-10-12; packet_loss count 10, bufferbloat 8 streams, 10 s).
// Targets are public resolvers; no hostnames or local IPs.
// One value per line so every line fits at 375px without wrapping.
export function Terminal() {
  return (
    <figure className="mx-auto w-full max-w-wide">
      <div className="overflow-hidden rounded-md border border-border bg-card text-left">
        <div className="flex items-center gap-4 border-b border-border px-4 py-3">
          <svg viewBox="0 0 52 12" aria-hidden="true" className="h-3 w-13 fill-border-strong">
            <circle cx="6" cy="6" r="5" />
            <circle cx="26" cy="6" r="5" />
            <circle cx="46" cy="6" r="5" />
          </svg>
          <span className="font-mono text-mono text-muted-foreground">agent session</span>
        </div>
        <pre className="overflow-hidden whitespace-pre-wrap break-words p-4 font-mono text-mono-sm leading-relaxed text-foreground md:p-10 md:text-body">
          <code>
            <span className="text-muted-foreground">$ </span>
            {SITE.installCommand}
            {"\n"}
            <span className="text-muted-foreground">
              Drift Workbench MCP server v{SITE.npmVersion} (stdio)
            </span>
            {"\n\n"}
            <span className="text-muted-foreground">agent › </span>
            packet_loss
            {"\n"}
            {"  "}target <span className="text-accent">1.1.1.1</span> · count{" "}
            <span className="text-accent">10</span>
            {"\n"}
            {"  "}loss <span className="text-accent">0.0%</span>
            {"\n\n"}
            <span className="text-muted-foreground">agent › </span>
            bufferbloat
            {"\n"}
            {"  "}idle <span className="text-accent">123.0 ms</span>
            {"\n"}
            {"  "}loaded <span className="text-accent">+284.5 ms</span>
            {"\n"}
            {"  "}grade <span className="text-destructive">D</span>
            {"\n\n"}
            <span className="text-muted-foreground">agent › </span>
            latency rises under load;
            {"\n"}
            {"  "}loss stayed at 0.0%
          </code>
        </pre>
      </div>
      <figcaption className="mt-4 text-center text-small text-muted-foreground">
        {HERO.terminalNote}
      </figcaption>
    </figure>
  );
}
