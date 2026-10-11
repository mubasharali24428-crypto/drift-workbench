import { TOOLS, TOOLS_SECTION } from "@/content/copy";

export function ToolGrid() {
  return (
    <section id="tools" className="px-4 py-20 sm:px-6 md:py-32">
      <div className="mx-auto max-w-wide">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-display-lg font-semibold">{TOOLS_SECTION.heading}</h2>
          <p className="mt-6 text-body-lg text-muted-foreground">{TOOLS_SECTION.sub}</p>
        </div>
        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <li
              key={tool.name}
              className="rounded-md border border-border bg-card p-5 transition-colors duration-180 hover:border-border-strong"
            >
              <code className="break-all font-mono text-mono text-foreground">{tool.name}</code>
              <p className="mt-2 text-small text-muted-foreground">{tool.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
