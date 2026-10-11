import { METRICS } from "@/content/copy";

export function Metrics() {
  return (
    <section id="metrics" className="px-4 py-20 sm:px-6 md:py-32">
      <div className="mx-auto max-w-page">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-display-lg font-semibold">{METRICS.heading}</h2>
          <p className="mt-6 text-body-lg text-muted-foreground">{METRICS.sub}</p>
        </div>
        <dl className="mx-auto mt-16 max-w-3xl border-t border-border">
          {METRICS.items.map((item) => (
            <div
              key={item.label}
              className="grid items-baseline gap-1 border-b border-border py-6 sm:grid-cols-[12rem_1fr] sm:gap-8"
            >
              <dd className="font-display text-display-md font-semibold sm:order-first">
                {item.value}
              </dd>
              <dt className="text-body text-muted-foreground">{item.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
