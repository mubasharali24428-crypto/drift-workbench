import { TRANSCRIPT } from "@/content/copy";

export function Transcript() {
  return (
    <section id="transcript" className="px-4 py-20 sm:px-6 md:py-32">
      <div className="mx-auto max-w-page">
        <h2 className="mx-auto max-w-3xl text-center font-display text-display-lg font-semibold">
          {TRANSCRIPT.heading}
        </h2>
        <figure className="mx-auto mt-16 max-w-3xl">
          <div className="rounded-md border border-border bg-card">
            <div className="border-b border-border px-4 py-3 font-mono text-mono text-muted-foreground">
              {TRANSCRIPT.label}
            </div>
            <ol className="space-y-5 p-5 md:p-8">
              {TRANSCRIPT.lines.map((line, i) => (
                <li key={i} className="grid gap-1 sm:grid-cols-[5rem_1fr] sm:gap-4">
                  <span className="font-mono text-mono text-muted-foreground">{line.role}</span>
                  <span
                    className={
                      line.role === "tool"
                        ? "break-words rounded-md border border-border bg-muted px-3 py-2 font-mono text-mono-sm text-foreground md:text-mono"
                        : "text-body text-foreground"
                    }
                  >
                    {line.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <figcaption className="mt-4 text-center text-small text-muted-foreground">
            {TRANSCRIPT.note}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
