"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PulseMark } from "@/components/PulseMark";
import { NAV_LINKS } from "@/content/copy";
import { SITE } from "@/lib/site";

const LINK =
  "inline-flex min-h-11 items-center text-small text-muted-foreground transition-colors duration-180 hover:text-foreground";

export function Nav() {
  const [open, setOpen] = useState(false);
  // Section anchors only resolve on the home page. Elsewhere they need the route prefix.
  const home = usePathname() === "/";
  const hrefFor = (h: string) => (home || !h.startsWith("#") ? h : `/${h}`);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:px-6">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 max-w-wide items-center justify-between rounded-md border border-border bg-card px-4"
      >
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-3 font-display text-body font-semibold"
        >
          <PulseMark className="size-6 text-accent" />
          Drift Workbench
        </Link>
        <ul className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={hrefFor(l.href)} className={LINK}>
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href={SITE.repoUrl} className={LINK}>
              GitHub
            </a>
          </li>
          <li>
            <a
              href={SITE.buyUrl}
              className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-4 text-small text-foreground transition-colors duration-180 hover:border-foreground"
            >
              Get the app · $29
            </a>
          </li>
        </ul>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex size-11 items-center justify-center rounded-md border border-border-strong md:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="size-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </nav>
      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-20 z-40 bg-background px-4 py-8 md:hidden"
        >
          <ul className="flex flex-col">
            {[...NAV_LINKS, { label: "GitHub", href: SITE.repoUrl }].map((l) => (
              <li key={l.href} className="border-b border-border">
                <a
                  href={hrefFor(l.href)}
                  onClick={() => setOpen(false)}
                  className="flex min-h-16 items-center font-display text-heading font-semibold"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={SITE.buyUrl}
            className="mt-8 flex min-h-12 items-center justify-center rounded-md bg-accent text-body font-semibold text-accent-foreground"
          >
            Get the app · $29
          </a>
        </div>
      )}
    </header>
  );
}
