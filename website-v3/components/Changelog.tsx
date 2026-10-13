import { Rich } from "@/components/Docs";
import { CHANGELOG } from "@/content/changelog";

const CARD = "scroll-mt-20 rounded-md border border-border bg-card p-6 sm:p-8";

export function Changelog() {
  return (
    <>
      <header className="px-4 pb-10 pt-20 text-center sm:px-6 md:pt-32">
        <h1 className="mx-auto max-w-3xl font-display text-display-md font-semibold">
          {CHANGELOG.heading}
        </h1>
        <p className="mx-auto mt-6 max-w-prose text-body-lg text-muted-foreground">
          <Rich text={CHANGELOG.sub} />
        </p>
      </header>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-20 sm:px-6 md:pb-32">
        {CHANGELOG.releases.map((release) => (
          <section key={release.version} id={`v${release.version}`} className={CARD}>
            <h2 className="font-display text-heading font-semibold">
              {release.version}{" "}
              <time dateTime={release.date} className="text-body font-normal text-muted-foreground">
                {release.date}
              </time>
            </h2>
            {release.sections.map((section) => (
              <div key={section.title} className="mt-6">
                <h3 className="font-mono text-mono text-muted-foreground">{section.title}</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item}>
                      <Rich text={item} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
