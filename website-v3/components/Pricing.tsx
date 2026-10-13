import { PRICING } from "@/content/copy";
import { SITE } from "@/lib/site";

export function Pricing() {
  return (
    <section id="pricing" className="px-4 py-20 sm:px-6 md:py-32">
      <div className="mx-auto max-w-page">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-display-lg font-semibold">{PRICING.heading}</h2>
          <p className="mt-6 text-body-lg text-muted-foreground">{PRICING.sub}</p>
        </div>
        <div className="mx-auto mt-16 max-w-md rounded-md border border-border bg-card p-8 text-left">
          <p className="font-mono text-mono text-muted-foreground">{PRICING.name}</p>
          <p className="mt-2 font-display text-display-lg font-semibold">{PRICING.price}</p>
          <p className="mt-2 text-small text-muted-foreground">{PRICING.note}</p>
          <ul className="mt-6 space-y-3">
            {PRICING.points.map((point) => (
              <li key={point} className="flex gap-3 text-body">
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="mt-1.5 size-4 shrink-0 fill-none stroke-accent stroke-2"
                >
                  <path d="M3 8.5l3 3 7-7" />
                </svg>
                {point}
              </li>
            ))}
          </ul>
          <a
            href={SITE.buyUrl}
            className="mt-8 flex min-h-11 items-center justify-center rounded-md bg-accent px-5 font-medium text-accent-foreground transition-colors duration-180 hover:bg-accent/90"
          >
            {PRICING.cta}
          </a>
        </div>
        <p className="mt-6 text-center text-small text-muted-foreground">{PRICING.mcpNote}</p>
      </div>
    </section>
  );
}
