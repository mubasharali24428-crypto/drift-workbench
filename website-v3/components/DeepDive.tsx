import { DEEP_DIVE } from "@/content/copy";

export function DeepDive() {
  return (
    <section id="deep-dive" className="px-4 py-20 sm:px-6 md:py-32">
      <div className="mx-auto max-w-page">
        <h2 className="mx-auto max-w-3xl text-center font-display text-display-lg font-semibold">
          {DEEP_DIVE.heading}
        </h2>
        <ol className="mt-16 border-t border-border">
          {DEEP_DIVE.steps.map((step, i) => (
            <li
              key={step.title}
              className="grid gap-3 border-b border-border py-10 md:grid-cols-[8rem_1fr_2fr] md:gap-10 md:py-14"
            >
              <span className="font-mono text-mono text-muted-foreground">0{i + 1}</span>
              <h3 className="font-display text-display-md font-semibold">{step.title}</h3>
              <p className="max-w-prose text-body-lg text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
