import { CommandBar } from "@/components/CommandBar";
import { FINAL_CTA } from "@/content/copy";

export function FinalCta() {
  return (
    <section id="install-cta" className="px-4 py-20 text-center sm:px-6 md:py-32">
      <div className="mx-auto max-w-page">
        <h2 className="mx-auto max-w-4xl font-display text-display-lg font-semibold">
          {FINAL_CTA.heading}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">{FINAL_CTA.sub}</p>
        <div className="mt-10">
          <CommandBar />
        </div>
      </div>
    </section>
  );
}
