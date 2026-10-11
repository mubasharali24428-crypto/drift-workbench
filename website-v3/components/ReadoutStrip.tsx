import { READOUT } from "@/content/copy";

export function ReadoutStrip() {
  return (
    <section aria-label="Product facts" className="px-4 sm:px-6">
      <dl className="mx-auto grid max-w-page grid-cols-2 border-y border-border md:grid-cols-4">
        {READOUT.map((item) => (
          <div
            key={item.label}
            className="border-border px-4 py-8 text-center md:border-l md:first:border-l-0"
          >
            <dd className="font-display text-display-md font-semibold">{item.value}</dd>
            <dt className="mt-1 font-mono text-mono text-muted-foreground">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
