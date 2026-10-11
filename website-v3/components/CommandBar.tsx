"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

const RESET_MS = 1800;

export function CommandBar() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    // clipboard.writeText rejects when the document lacks permission.
    try {
      await navigator.clipboard.writeText(SITE.installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), RESET_MS);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2 rounded-md border border-border-strong bg-card p-2 sm:flex-row sm:items-center sm:gap-3 sm:pl-4">
      <div className="flex min-w-0 flex-1 items-center gap-3 px-2 pt-2 sm:p-0">
        <span aria-hidden="true" className="font-mono text-mono text-accent">
          $
        </span>
        <code className="min-w-0 break-all text-left font-mono text-mono text-foreground">
          {SITE.installCommand}
        </code>
      </div>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-border-strong bg-muted px-4 text-small text-foreground transition-colors duration-180 hover:border-foreground"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy"}
        <span className="sr-only"> install command</span>
      </button>
      <span role="status" className="sr-only">
        {copied ? "Install command copied" : ""}
      </span>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="size-4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="size-4 text-accent"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}
