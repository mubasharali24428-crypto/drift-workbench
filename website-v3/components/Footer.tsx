import { FOOTER } from "@/content/copy";
import { SITE } from "@/lib/site";

const LINK =
  "inline-flex min-h-11 items-center transition-colors duration-180 hover:text-foreground";

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-page flex-col gap-6 text-small text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-body font-semibold text-foreground">{SITE.name}</p>
          <p className="mt-1">{FOOTER.note}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6">
          <a
            href={SITE.npmUrl}
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-3 font-mono text-mono transition-colors duration-180 hover:text-foreground"
          >
            @drift-workbench/mcp-server@{SITE.npmVersion}
          </a>
          <a href={SITE.repoUrl} className={LINK}>
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
