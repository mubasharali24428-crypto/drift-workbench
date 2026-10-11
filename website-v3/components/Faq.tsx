import { FAQ } from "@/content/copy";

export function Faq() {
  return (
    <section id="faq" className="px-4 py-20 sm:px-6 md:py-32">
      <div className="mx-auto max-w-page">
        <h2 className="mx-auto max-w-3xl text-center font-display text-display-lg font-semibold">
          {FAQ.heading}
        </h2>
        <div className="mx-auto mt-16 max-w-3xl space-y-3">
          {FAQ.items.map((item) => (
            <details key={item.q} className="group rounded-md border border-border-strong bg-card">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-body font-medium transition-colors duration-180 hover:text-accent [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden="true" className="font-mono text-muted-foreground">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </span>
              </summary>
              <p className="px-5 pb-5 text-body text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
