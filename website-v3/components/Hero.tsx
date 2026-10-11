import { CommandBar } from "@/components/CommandBar";
import { Terminal } from "@/components/Terminal";
import { HERO } from "@/content/copy";
import { SITE } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-20 text-center sm:px-6 md:pb-32 md:pt-32">
      <div className="mx-auto max-w-page">
        <p className="font-mono text-mono text-muted-foreground">{HERO.eyebrow}</p>
        <h1 className="mx-auto mt-6 max-w-5xl font-display text-display-xl font-semibold">
          {HERO.headline} <span className="text-accent">{HERO.headlineAccent}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
          {HERO.subhead}
        </p>
        <div id="install" className="mt-10">
          <CommandBar />
          <a
            href={SITE.buyUrl}
            className="mt-4 inline-flex min-h-11 items-center text-small text-muted-foreground underline underline-offset-4 transition-colors duration-180 hover:text-foreground"
          >
            {HERO.secondaryLabel}
          </a>
        </div>
      </div>
      <div className="relative isolate mx-auto mt-16 max-w-wide md:mt-24">
        <div className="ambient-glow -z-10 scale-150" aria-hidden="true" />
        <Terminal />
      </div>
    </section>
  );
}
