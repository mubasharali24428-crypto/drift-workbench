import { HOW } from "@/content/copy";

export function HowItWorks() {
  return (
    <section id="how" className="px-4 py-20 sm:px-6 md:py-32">
      <div className="mx-auto max-w-page px-4">
        <h2 className="mx-auto max-w-3xl text-center font-display text-display-lg font-semibold">
          {HOW.heading}
        </h2>
        <ol className="mx-auto mt-16 max-w-2xl border-l border-border">
          {HOW.steps.map((step, i) => (
            <li key={step.title} className="relative pb-12 pl-8 last:pb-0 sm:pl-10">
              <span className="absolute -left-4 top-0 flex size-8 items-center justify-center rounded-md border border-border-strong bg-background font-mono text-mono text-foreground">
                {i + 1}
              </span>
              <h3 className="font-display text-heading font-semibold">{step.title}</h3>
              <p className="mt-2 text-body text-muted-foreground">{step.body}</p>
              {"code" in step && (
                <code className="mt-4 block overflow-x-auto whitespace-nowrap rounded-md border border-border bg-muted px-3 py-3 font-mono text-mono-sm text-foreground sm:px-4 sm:text-mono">
                  {step.code}
                </code>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
