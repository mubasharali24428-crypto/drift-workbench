# DRIFT WORKBENCH WEBSITE: SESSION HANDOFF (paste this into the new chat)

You are joining a project mid-flight. Read this fully, then do "First steps" at the bottom. Do not rebuild anything marked done.

## 1. Goal

A Raycast-caliber marketing site for **Drift Workbench** (network diagnostics your AI coding agent can run itself), the centerpiece of startup-program applications (Cloudflare for Startups, YC, a16z speedrun, SPC, Antler, Techstars). Job: CREDIBILITY for reviewers. Public launch is paused, so everything is framed as private preview / founding cohort. Never fake traction. Ships as a static export to Cloudflare Pages.

When uncertain, choose the more restrained, more specific, more confident option. When in doubt, remove.

## 2. Where everything is

- **Active build (v3): `/Users/user/netmax-app/website-v3/`**. Next.js 15, React 19, Tailwind v4, static export. Committed on `main` in `/Users/user/netmax-app` (`77dc9a4`, `5f8f614`, `d106bae`, `40342c9`, `0d916e5`). Nothing is pushed. Run `git -C /Users/user/netmax-app status --short website-v3` for anything uncommitted. The repo also holds unrelated untracked files (trial_server DB, `landing/` and `plugins/` scripts, the v2 folders, `.bak-rename` files) that were left alone on purpose.
- `website-v3/CLAUDE.md` and `website-v3/DESIGN.md`: the governing rules and design system. READ BOTH FIRST. Tokens live in `app/globals.css`, motion constants in `lib/motion.ts`, fonts in `app/fonts.ts`.
- `website-v3/DEPLOY.md`: Cloudflare Pages settings written in an earlier session. Treat it as unverified until Phase 7 says otherwise.
- **v2 site (copy reference only, do not rebuild): `/Users/user/netmax-app/website`** (identical snapshot in `website-v2-snapshot`).
- **Phase 4 inputs (approved copy): `/Users/user/drift-workbench-phase4-inputs.txt`**. Has the 20 tool names and descriptions, the 5 FAQ Q&As (verbatim) and the agent transcript. Use it, don't mine v2.
- MCP server source (ground truth for tools): `/Users/user/netmax-app/desktop/netmax-mcp-server.mjs`.
- Phase 2 foundation zip (already copied into v3): `~/Desktop/files.zip`.
- Original build prompt (history only): `~/Desktop/drift-workbench-website-build-prompt1.md`. It conflicts with the current direction (left-aligned hero, 2px radius, #0B1120). The CURRENT direction wins: centered, 10px radius, #0B0C0E.
- **The Raycast-direction master prompt is NOT on this machine.** It lives in a claude.ai chat under another email. `CLAUDE.md` + `DESIGN.md` in v3 are the approved distillation. Do not ask for it again unless a spec question can't be answered from them.

## 3. Status (as of 2026-10-11)

- **Phases 1-3: done, approved.** Tokens in OKLCH, `--color-*: initial` strips the default palette, one radius (10px), `border-strong` for 3:1 control outlines. Hero: centered, headline "Your AI agent is blind to the network. Fix that." (green accent), `CommandBar` (install command + copy), giant `Terminal` with REAL values (packet_loss target 1.1.1.1 count 10 loss 0.0%; bufferbloat idle 123.0 ms, loaded +284.5 ms, grade D; refreshed 2026-10-12, see 9b), Gumroad $29 link, `Nav` with mobile overlay, `ReadoutStrip` (20 / 0 / 0 / 100%).
- **Phase 4 (sections): DONE. Every section was founder-approved one at a time and screenshot-verified at 375 / 768 / 1440.** Page order: hero, readout strip, ecosystem grid (`#tools`, 20 cards), How it works (`#how`), Deep dive (`#deep-dive`, the ONE pinned section), Transcript (`#transcript`, "Illustrated flow"), Metrics (`#metrics`), Pricing (`#pricing`, one $29 tier), FAQ (`#faq`, native `<details>`, 5 Q&As), Final CTA (`#install-cta`), footer (npm 1.0.8 badge, GitHub).
- **Phase 5 (motion pass): audited, done.** Reveals are once-only and set by script (no `opacity:0` in the built HTML, so content is visible without JS). Hero parallax is transform-only. Every transition is color-only, 180 ms. No hover scale, bounce or typing. Exactly one pin (`start: "top 80px"`, gate `(min-width: 768px) and (min-height: 800px)`; shorter or narrower viewports keep the stacked layout). Anchors clear the 65px sticky nav. Reduced motion verified by forcing `matchMedia`: no pin, no Lenis, no reveals, no parallax. `Motion.tsx` refreshes ScrollTrigger on `document.fonts.ready` and removes its `load` listener on cleanup.
- **Phase 6 (quality gates): done on the LOCAL build.** Lighthouse 13.5.0, headless Chrome 154, served with brotli and the `_headers` caching. Mobile (3 identical runs): performance 98, accessibility 100, best practices 100, SEO 100; LCP 2.3 s, TBT 30 ms, CLS 0. Desktop: 100 / 100 / 100 / 100. Install command checked byte-for-byte: 6 exact occurrences in `out/index.html`, no variants, no non-ASCII near it. `npm view @drift-workbench/mcp-server version` = 1.0.7. Banned-word scan of the built HTML: 0 hits (after the "throughput" edits). All in-page anchors resolve; GitHub and Gumroad return 200 (npm returns 403 to curl only because it blocks bots).
- **Lighthouse on the other pages (2026-10-12, LOCAL build, same method as the homepage: Lighthouse 13.5.0, headless Chrome, Pages-like server, 3 mobile runs + 1 desktop each).** All runs: accessibility, best practices and SEO 100, CLS 0, no runtime errors. `/docs`: mobile performance 98 / 99 / 99 (LCP 1.95 to 2.34 s, TBT 31 to 34 ms); desktop 100 / 100 / 100 / 100. `/agents/pricing`: mobile 99 / 98 / 98 (LCP 1.95 to 2.33 s, TBT 15 to 30 ms); desktop 100 across the board. `/changelog`: mobile 98 / 98 / 98 (LCP 2.33 s, TBT 27 to 31 ms); desktop 100 across the board. Same bar as the homepage (mobile 98, desktop 100). The "Network dependency tree" insight scores 0 on every page including the homepage; it has weight 0 in the performance category. Still not measured: the DEPLOYED URL.
- **Phase 7 (Cloudflare Pages deploy prep): PLAN WRITTEN AND ATTACKED, PREVIEW ARTIFACT STAGED, NOTHING DEPLOYED.** Founder guardrail (binding): deploy to a Cloudflare Pages PREVIEW first, never cut over production, state how the preview avoids touching production, and bring the preview URL back for review before anything goes live. Done: research (Cloudflare docs, how production deploys today, deploy-readiness), a plan, four adversarial reviews of it (all four flagged real problems; fixed below), a preview artifact that passes six pre-upload gates, a tested command guard, and a repaired proof tool. Waiting on founder decisions (section 10). No wrangler installed, no Cloudflare login, nothing uploaded, nothing pushed.

## 4. Decisions already made (do not re-litigate)

1. Grade "F" is red (`text-destructive`). One documented exception to "destructive = errors only" (in DESIGN.md).
2. The nav has a live Docs link to `/docs`, a new in-repo page (`app/docs/`, `components/Docs.tsx`, `DOCS` in `content/copy.ts`). It is not the old `/drift/docs/`, which still 404s in this build. The founder approved the page on 2026-10-12. Content comes from the MCP server source, the READMEs and the approved FAQ and Pricing copy. The old docs' Homebrew line, "free forever" and Pro-feature claims were dropped on purpose and stay dropped until he gives exact wording. Inline prose links are exempt from the 44px rule.
3. Terminal is one value per line, with a `text-mono-sm` token (0.75rem) below `md`, so it never wraps at 375.
4. Tool descriptions: verbatim from the inputs file EXCEPT five, each edited by one word because the originals contained banned words. **The founder approved all five.**
   - `eco_bloat`: "Bufferbloat estimate using ~100KB of data" (was "Quick bufferbloat…")
   - `diagnostic_summary`: "Network health overview" (was "Quick network health overview")
   - `boost`: "Baseline vs multi-stream gain percentage" (was "…turbo gain…")
   - `upload_speed`: "Upload throughput in Mbps" (was "Upload speed in Mbps")
   - `parallel_diagnostics`: "Throughput, DNS, bloat and WiFi in one concurrent call" (was "Speed, DNS, bloat…")
   All in `content/copy.ts` (a comment above `TOOLS` lists them).
5. Tool identifiers `measure_speed`, `upload_speed` and `boost` stay as mono names (allowed). The banned-word scan of the built HTML must report 0 hits.
6. Grid heading/subhead is my wording (inputs file had none): "Twenty tools your agent can call." / "One install registers all of them. Every name below is read from the MCP server source." Founder can change it.
7. The founder confirmed in a real browser that Copy works and `npx -y @drift-workbench/mcp-server` runs (v1.0.7, 20 tools registered). `npm view @drift-workbench/mcp-server version` returned 1.0.7 on 2026-10-11.
8. Hero terminal shows only the first banner line of the real server output (no engine path, no Python path, to avoid leaking local machine details).
9. Transcript heading ("What the session looks like.") and note ("The layout is illustrated. The measured values come from the one local run shown above.") are not in the inputs file. Founder approved them.
10. Metrics: the first label reads "parallel probes completed clean". Founder approved it as written.
11. Final CTA sub-line is the founder's wording: "One command. Free MCP server. Zero telemetry." ("Nothing leaves your machine" was dropped: the FAQ admits one trial-activation call.)
12. FAQ answers are the approved text verbatim, including "Windows probe parsers are validated on real captures; the full Windows suite is pending". That differs from the brief's wording but does not claim full Windows support. Approved as is.

## 5. Binding constraints (full list in CLAUDE.md; these are the ones that bite)

- No invented users, revenue, logos, press, testimonials or metrics. Only the verified numbers: 20 tools; 50/50 parallel probes; 100-probe soak +0.1MB; 8/8 fault tests, zero fabricated values; 16/16 Linux unit tests; the one measured run above.
- Install command exactly `npx -y @drift-workbench/mcp-server`, everywhere.
- Banned as marketing claims: speed, boost, turbo, ultra, hyper, fast, quick, "Max", seamless, robust, cutting-edge, revolutionize, empower, unlock, next-generation, game-changing, best-in-class, leverage. No "AI-powered X for Y". Tool identifiers (`boost`, `measure_speed`) may appear in mono as names only.
- One accent (green), one radius (10px), one glow (hero only), one pinned section, one display font. No shadows, gradients (except the glow), glassmorphism, emoji. Semantic tokens only; no raw hex or palette classes.
- Windows wording: "Windows probe parsers validated against real Windows 11 captures." Never "full Windows support". No Homebrew command. One pricing tier ($29 Founding License, macOS 13+, Gumroad); MCP server is free.
- GitHub URL only from `git -C /Users/user/netmax-app remote get-url github` (currently `https://github.com/mubasharali24428-crypto/netmax.git`; repo still has the old name, keep linking it honestly). Anything simulated is labelled simulated.
- If a request would violate these or CLAUDE.md, flag the conflict instead of complying.

## 6. How we work

- Phase approval gates. Build or review one section, screenshot at **375 / 768 / 1440**, give a **two-sentence report**, then WAIT for approval.
- Playwright is not installed. Use the built-in browser pane: serve `out/` and use `resize_window` plus screenshots.
- **Hidden-pane gotcha.** When the browser pane is not visible, `requestAnimationFrame` and scroll events stop, so the pin and reveals do not run and the pin spacer is never laid out. To test motion anyway: `fetch('/')` the page HTML and `document.write` it back with a `<script>` in `<head>` that replaces `requestAnimationFrame` with a 16 ms `setTimeout`, then `window.dispatchEvent(new Event('scroll'))` after each `scrollTo`, and wait about 2 s per step. This re-runs Next's inline data scripts and logs `enqueue` TypeErrors; those come only from the harness, a plain load has no console errors. After a scroll, layout can shift once the pin spacing lands, so scroll twice before measuring.
- The user's global `/Users/user/CLAUDE.md` also applies: print an `Assumptions:` line before writing code, a numbered plan (`step → verify: check`) for multi-step work, name the exact verification you ran before claiming done, keep diffs surgical, and stop and ask when a rule and a request conflict.
- Commit only when asked. Always end commit messages with the `Co-Authored-By` line the harness specifies.

## 7. Commands and gotchas

```
cd /Users/user/netmax-app/website-v3
pnpm typecheck && pnpm lint && pnpm format:check && pnpm check:prohibited
pnpm build                  # static export to out/, must have zero warnings
cd out && python3 -m http.server 8811 --bind 127.0.0.1
```

- `pnpm build` deletes and recreates `out/`. Restart the http server after every build or it serves nothing.
- The guard regex flags `\b(from|via|to)-` anywhere in `app/ components/ lib/`. Do not write strings like `skip-to-content` in code.
- To scroll to a section in the browser pane use `element.scrollIntoView()`, not `offsetTop`.
- Installed: GSAP 3.13 and Lenis (both dynamically imported in `components/Motion.tsx`), ESLint, Prettier. Deliberately NOT installed (add only if a section needs them): Motion, `@gsap/react`, Plausible, shadcn. The FAQ is native `<details>`.
- **Session-scratch tools (NOT in the repo; they live in the Claude session scratchpad and are lost with it unless the founder says where to keep them):** `checks/scan_copy.py` (banned-word and claim scan of `out/index.html`, exit 0 = zero hits), `checks/baseline.py` (read-only snapshot of a live site, then `compare`, `assert-pins`, `fresh`; any failed fetch is INVALID and exits 2, header changes count as differences), `deploy-kit/wr.sh` (the wrangler allowlist guard) with `deploy-kit/test-wr.sh` (37 tests, bash and zsh, stub binary), `serve.mjs` (static server adding brotli/gzip and the `_headers` cache rules; plain `python3 -m http.server` sends neither, which skews Lighthouse), and `preview-out/` (the staged preview artifact). Lighthouse is also installed only in the scratchpad (176 MB). Baseline snapshots of production are in `baseline/` (`prod-before.json` holds the pinned sha256 values).

## 8. Not yet verified

- Lighthouse on the DEPLOYED URL (the numbers above are localhost with simulated mobile throttling).
- Real OS "Reduce motion" (tested by overriding `matchMedia`, not the macOS setting), and how the pin and Lenis feel at real frame rates in a visible browser.
- JSON-LD in a Rich Results test; the OG image in a real link unfurl; the canonical host (placeholder, see section 9).
- Bundle: about 104 kB first-load JS (Next's gzipped figure) against the 150 KB budget.

## 9. Open founder items (not yours to decide)

**Deferred by the founder on 2026-10-11 ("we will do these at another time"):**

1. **Notarization disclosure.** `/Users/user/netmax-app/RELEASE-NOTES.md` says the macOS build is not notarized yet, so a buyer hits a Gatekeeper warning on first open. The old landing page disclosed it ("funds the Apple Developer account that notarizes the build"); the new Pricing card does not mention it. Decide: add a line to the Pricing card, or leave it out on purpose.
2. **Trial backend contradiction.** `/Users/user/netmax-app/docs/product/landing-claims.md` says "there is no recurring billing or trial backend", but the brief's honest limits and `trial_server/` describe a hardware-bound, server-verified 14-day trial. The Pricing bullet "14-day trial, no account" and two FAQ answers (phone home, trial) follow the brief. Confirm which is true; if the audit is right, those three places must change.
3. **Gumroad listing title.** The buy link opens a listing still titled "NetMax Desktop Pro" while the page says "Founding License". Founder's dashboard fix.

**Other open items:**

- `/drift/docs/` 404s in the new build: port the real docs from the old static site, or keep the link out.
- GitHub remote still named `netmax`.
- Final site URL / domain. Canonical, og:url, og:image, sitemap and robots currently point at the placeholder `https://drift-workbench.pages.dev` from `lib/site.ts` (env `NEXT_PUBLIC_SITE_URL` overrides it at build time). That host may not belong to the founder.
- **Production today:** `https://mubasharbuilds.pages.dev` serves the OLD site as a single-page app (no `404.html`: the homepage body is returned for any unknown path). Real content only at `/`, `/assets/site.js`, `/assets/style.css`, `/drift/`, `/drift/docs/`. A production deploy of v3 would remove `/drift/`, `/drift/docs/` and the old assets, and unknown URLs would become real 404s. Hence the preview-only guardrail. The source of the live site exists nowhere on this machine (no local file matches its bytes); a byte-exact copy of the 5 live files was saved to the scratchpad and matches the pinned hashes.

**Found incidentally by the Phase 7 research (not caused by the site; the founder should act):**

- **2026-10-11: the `b9bcf43` HMAC secret was REMOVED via local history rewrite.** It is now commit `d3a567b` ("Wire trial registry: deployed worker URL (HMAC secret left as build-time placeholder)"); `TrialRegistryClient.swift` line 154 is back to the `REPLACE-WITH-DEPLOYED-HMAC-SECRET` placeholder (fail-closed, no secret in history or working tree). Old chain preserved on branch `backup-main-20261011`; nothing pushed. The old do-not-push warning for the secret no longer applies — but any push is still the founder’s call. If the removed secret matches the deployed worker’s `NETMAX_TRIAL_HMAC_SECRET`, rotate the worker secret (it may also sit in a session transcript). Also unknown: whether the Cloudflare project is linked to that GitHub repo (a push could then start a production build).
- **Plaintext credentials on this machine:** an npm auth token in `~/.npmrc`; two npm tokens typed into `npm config set` in `~/.zsh_history`; several API keys exported in `~/.zshrc`. By its own disclosure, one research agent's over-broad command DISPLAYED two of the npm tokens in its tool output, so they sit in a local session transcript. Rotate the npm tokens (the repo's `SESSION-HANDOFF.md` already says one needs rotation).
- **Placeholder host is unclaimed:** `drift-workbench.pages.dev` does not resolve today, but anyone could claim it, and the repo default points canonical, og:url, sitemap and robots at it. Decide the real origin; consider making `lib/site.ts` throw at build time when `NEXT_PUBLIC_SITE_URL` is unset (a source change, propose separately).
- **Hygiene:** Tailwind v4 scans every non-ignored file including `*.md`, so words in the docs can add stray utilities to the shipped CSS (the old HANDOFF text added `.table{display:table}`). Harmless but real; `@source not` in `globals.css` would stop it. `check:prohibited` passes silently when ripgrep is missing.

## 9b. npm 1.0.8: published, site updated (2026-10-12)

The founder published `@drift-workbench/mcp-server@1.0.8`. `npm view` confirmed it: the `latest` tag is 1.0.8, and `dist.integrity` (`sha512-tIzVUsPJXON2…M9UA==`, shasum `259b876a…`) equals the tarball verified before publish, so the published bytes are the ones that were checked. On the site, the FAQ "Which platforms are supported?" answer and the `/docs` Windows line are back to the founder's original wording, and `npmVersion` in `lib/site.ts` is `1.0.8`.

Verified against the published package (2026-10-12): `npx -y @drift-workbench/mcp-server@1.0.8` from an empty directory with a fresh npm cache and no `.npmrc` reports server version 1.0.8 and registers 20 tools, and its engine is byte-identical to `desktop/engine/` (25 files). The hero terminal and the Transcript section now carry that run's values: packet_loss 0.0%, bufferbloat idle 123.0 ms, loaded +284.5 ms, grade D (they were 63.8 ms, +542.6 ms and F on 2026-10-11). It is one run on one machine, and the two runs differ a lot, so the figures vary with the network, not with the version. `evidence_export` was run end to end on the same package against the real desktop history: two records exported, each record's sha256 recomputes, no IPv4 or MAC address left in the bundle, history files unchanged. An out-of-range record ID fails honestly, but the message is wrapped in an argparse usage dump (`export-evidence` calls `parser.error`).

Caveat: the full Windows MCP suite has still not been run, so "runs anywhere Node runs" is the founder's wording, not something verified end to end.

Repo state: every version pin in `/Users/user/netmax-app` is 1.0.8, `desktop/engine/` is synced (25 files), and pytest fails on mirror drift or an unmirrored import. Nothing is pushed. The Cloudflare preview still has the older build; refreshing it needs the founder's wrangler login, and production cutover stays his call.

Fixed in the repo before publish (2026-10-12): `server.json`, `desktop/package-lock.json` and the shipped `desktop/README.md` now use `@drift-workbench/mcp-server` and say 20 tools (the mcpb manifest lists all 20). The npm README is rebranded in prose, has no Homebrew block and links the GitHub releases page. `MCP-README.md` has generic paths. The plugin scripts and `tests/test_plugins.py` use the new package name. The perf test never writes into the repo; its four unmeasured limits are TODO, not PASS.

Still open (founder's decisions):

- The Homebrew cask `/Users/user/homebrew-netmax/Casks/netmax.rb` is still 1.0.7. It installs the desktop-app DMG at `releases/download/v<version>/…dmg` with a pinned sha256, so bumping `version` without a built and uploaded 1.0.8 DMG breaks `brew install`. Leave it until a DMG exists. `desktop/scripts/sync_versions.sh` in apply mode would edit that file outside the repo and does not cover `server.json`, the manifests or the lockfiles. Use `--check` only.
- The server version is hardcoded in four places in `desktop/netmax-mcp-server.mjs`; it is not read from `package.json`.
- Still on the old name or brand, deliberately untouched: the mcpb manifest's `name` and `display_name` ("netmax" / "NetMax MCP Server"); the Swift app's UI strings (README line about the "NetMax" menu-bar item stays accurate until they change); `docs/MCP-DIRECTORY-SUBMISSIONS.md`, `docs/MARKETING-COPY.md`, `docs/product/landing-claims.md` and the old `landing/index.html` (it shows `npx @netmax/mcp-server`; do not deploy it as is).
- ROADMAP task E-05-MCP also requires first-result p95, cancellation, peak RSS and idle CPU limits. None is measured yet (`test_mcp_performance_limits.mjs` reports them as TODO).

## 9c. Paid tier: license keys on the registry worker + /agents/pricing (built 2026-10-12, uncommitted, NOT deployed)

Scope the founder approved: worker and website only; Swift app untouched; Python reference server stays trial-only; no true x402; enforcement at license verification and a `requireLicense` gate for future remote/paid endpoints, never per local probe. One paid tier ($29 Founding License); the MCP server stays free; no MCP tool is gated.

**Worker (`/Users/user/netmax-app/trial-server-worker`, details in its README):** new `src/license.js`, additive store methods, `licenses` and `license_seats` tables in `schema.sql`, routes `POST /v1/license/activate` and `GET /v1/license/status` in `worker.js`, `scripts/gen-license-key.mjs`. Gumroad issues one key per sale; the worker verifies it with Gumroad's license API, binds it to the machine fingerprint (2 seats per key), and returns an Ed25519 token. Only `SHA-256(key)` is stored; no email. Tokens verify offline with a public key only (nothing secret in the app). `trial.js` and the 28 trial tests are untouched. `wrangler.toml` worker name is now `drift-trial-registry` (the deployed one) and has a `GUMROAD_PRODUCT_ID` var; its `database_id` and `GUMROAD_PRODUCT_ID` are still placeholders for the founder. License routes fail closed (500) while those are unset; trial routes keep working.

**Verified:** `npm test` in the worker: 64 of 64 (28 trial, 28 license, 8 worker.js on real SQLite via `node:sqlite`, including the atomic seat bind under parallel activations). A worker-minted token verifies in `node:crypto` and in Swift CryptoKit, and a different fingerprint fails. Python `tests/test_trial_server.py`: 18 passed. Not verified: the Cloudflare Workers runtime itself (Ed25519 WebCrypto is standard there, but it was only run on Node 22), and Gumroad's live response (the field names `refunded` and `chargebacked` and the key's letter case come from search results of a docs mirror; the founder is confirming on his side).

**Website:** `content/agents-pricing.ts` is the one source. It feeds `/agents/pricing` (page with JSON-LD) and `/agents/pricing.json` (static route), and uses only wording already approved in `copy.ts`: free MCP server, 14-day trial, $29 one-time Founding License, and an honest "agent payments: not supported" note. It does not mention license keys, x402 or any Pro feature list. `/agents/pricing` is in the sitemap, not in the nav. Checked: JSON, HTML and JSON-LD agree; 0 banned words; one H1; no overflow at 375 px. `product.url` follows `SITE.url` (placeholder host until a domain exists).

**Held on purpose (the founder's call):**
- The privacy copy ("The only network call is one trial activation", in the FAQ and `/docs`) becomes untrue once the app calls the license routes. Leave it until then, then reword with approval.
- Swift wiring: `LicenseGate` still does only a local format check (`docs/LICENSE-GATE.md` describes that). The app needs the public key printed by `gen-license-key.mjs`, plus calls to activate (periodically) and status.
- Gumroad: turn on per-sale license keys, retitle the listing (still "NetMax Desktop Pro"), copy the product ID.
- Deploy: exact commands are in the worker README ("Deploy"). Nothing was run against Cloudflare.
- Later: true x402 micropayments; a real remote/paid endpoint (use `requireLicense`).

## 9d. Changelog page (built 2026-10-12, uncommitted, preview-only)

`/changelog` shows the published npm releases 1.0.8 (2026-10-12) and 1.0.7 (2026-10-10); dates are the registry's publish times. Source: `content/changelog.ts`, built from `RELEASE-NOTES.md` and checked against the published package: 1.0.7 has 26 files and 1.0.8 has 31 (the five modules added), the 1.0.7 engine mirror at git HEAD contains the long-run fix and the `limit` governor, and 1.0.7 is the first version under `@drift-workbench/mcp-server` (the old `@netmax/mcp-server` exists on the registry). The page is in the sitemap, not in the nav or footer (your call).

Left out on purpose: the 1.0.7 desktop-app items (Mode Lab, Speed Limit card, Quick Test length picker), because no DMG for those versions is verified; repo-only 1.0.8 items (the parity test, `py-modules`, `audit --strict`); and the measured numbers from the 1.0.7 notes, which could not be re-run. The `limit` governor entry says it is not an MCP tool, since `strict_limit` uses kernel-level shaping. `RELEASE-NOTES.md` no longer carries the "(draft, not published)" marker. If you want the desktop items in, give the DMG version they shipped in.

Held for you: email capture (needs a provider) and analytics (needs your ruling on the script and a footer line). Neither is started.

## 9e. Task 3: verification & hygiene debt (done 2026-10-12, uncommitted, nothing pushed)

1. **Version single source.** `desktop/netmax-mcp-server.mjs` no longer hardcodes
   the version: `SERVER_VERSION` is read from `desktop/package.json` at startup
   (falls back to `"unknown"`, never crashes) and feeds the MCP `serverInfo`,
   the stdio banner, and both web status lines. New
   `desktop/test_mcp_version_source.mjs`: 3/3 pass (serverInfo + banner match
   package.json; no hardcoded copy in source). Negative control: a tampered
   copy with a hardcoded divergent version fails the test as expected.
2. **evidence_export error.** `netmax.py` `export-evidence` no longer calls
   `parser.error` on a bad record ID: one stderr line
   (`export-evidence: record id 'rec-99' out of range: history holds N records`),
   exit 1, no argparse usage dump. Mirror `desktop/engine/netmax.py` re-synced
   (byte-identical, parity pytest green). Two new CLI tests in
   `tests/test_export_manifest.py` lock the one-line behavior; happy path
   verified live (exit 0, bundle valid).
3. **E-05 measured.** All four TODO limits measured against the real 1.0.8
   server on this Mac (M2 Max, macOS 26.7.2, node v26.10.0, direct engine
   mode): first-result p95 3.47 s (n=30 `packet_loss`, limit 20 s),
   cancellation 0.064 s (limit 2 s), peak RSS 183 MiB (server + 2 concurrent
   jobs, limit 512 MiB), idle CPU 0.0% (30 samples / 61 s, limit 1%).
   Raw numbers + method in `docs/reviews/upgrade-evidence.md` (E-05-MCP, now
   DONE). `test_mcp_performance_limits.mjs` flips the four TODOs to PASS with
   the measured values. Note: `dns_ranking` fails honestly here (UDP/53 to
   public resolvers unreachable); `packet_loss` (ICMP) used instead.
4. **Windows suite.** Plan only: `docs/WINDOWS-TEST-PLAN.md` (exact PowerShell,
   what to capture, where to save). Not run — the agent cannot operate inside
   the Windows guest; the run is MAX's hands. Never claimed as passed.
5. **npm README.** `desktop/README.md` 242 -> 69 lines (user-facing
   install/usage only); ~180 lines of internal build/verify/distribution
   notes moved verbatim to `desktop/docs/BUILD-NOTES.md` (repo only, not
   shipped). `npm pack --offline --ignore-scripts` -> 31 files; tarball
   scanned clean: no `@netmax/`, no `brew`, no `/Users/` personal paths
   (one `/Users/Shared` system constant), no secret patterns.
6. **Old-name leftovers.** HELD for MAX's answer to (d).
7. **Clutter.** 70 gitignored scratch files (`fix_*`/`patch_*`/`builder*`/
   `mega_*` in root, `run_res_test*.mjs` in desktop/) — unreferenced by
   tracked code, safe to delete; 10 `*.bak-rename` files (untracked, visible
   in git status) are pre-rename snapshots, verified superseded. Nothing
   deleted; proposal with MAX.

Verified this session: full pytest 1299 passed + 5 subtests (exit 0); node
suites (version/perf/fleet/resource) 31/31; `uv lock --check --offline`
exit 0; `netmax audit --strict` 0 errors (1 pre-existing TOOL_COUNT warning,
untouched by this work); `git status` shows nothing staged or committed.
NOT verified: Windows suite (plan only); the packed tarball was scanned but
not published.

## 9f. Task 1: app-side paid-license activation (done 2026-10-12, uncommitted, nothing pushed)

Worker contract unchanged (trial-server-worker `npm test` still 64/64).

1. **LicenseClient** (new section in `TrialRegistryClient.swift`, same conventions:
   injectable transport, `REPLACE-WITH-*` fail-closed). `POST /v1/license/activate`
   and `GET /v1/license/status` against the registry worker. The app embeds ONLY
   the Ed25519 public key (`embeddedLicensePublicKey =
   "REPLACE-WITH-DEPLOYED-LICENSE-PUBLIC-KEY"` — placeholder fails closed: no
   unverified Pro, no network). Token verifies offline with CryptoKit over
   `license-v1|<fingerprint_sha256>|<key_sha256>|<issued_at>`.
2. **LicenseGate**: `activate(key)` is now server-verified (key format is the
   server's business — the old 5x4 `isWellFormedKey`/`KEY_PATTERN` is gone).
   Verified bundle persisted under `netmax.prefs.*` (`licenseKeySHA256`,
   `licenseToken`, `licenseIssuedAt`, `licenseVerifiedAt` — hashes/signature/
   timestamps, nothing secret). `resolvedTier` grants Pro only on a valid
   offline token for this machine. `refreshLicenseStatus()` runs on launch
   (cheap status read) and a full re-activate at most every 24h while online —
   this is how refunds/revokes propagate. 503/offline keeps the last verified
   state; revocation drops the bundle but keeps the key string (non-destructive,
   data never touched). `deactivate()` clears key + bundle.
3. **SettingsView**: key field hint/placeholder updated for Gumroad keys
   (no more 5×4 format gate on the Activate button); license refresh added to
   the section's `onAppear`.
4. **Tests** (`LicenseGateTests.runAll()`): mint a real Ed25519 keypair in-test
   and serve stub-signed tokens — valid token, tampered token, wrong
   fingerprint, seat-limit + invalid-key denials, blank key (no network),
   placeholder public key (fail-closed), revocation via status
   (Pro dropped, key kept), offline + 503 keep last verified Pro, 24h throttle
   (no network when fresh). Also fixed two pre-existing harness bugs the work
   exposed: the throttle test backdated shared defaults, and the
   "placeholder host" trial test used the default client (which now points at
   the deployed worker — it hit the real network); it now uses an explicit
   placeholder URL.
5. **Docs**: `docs/LICENSE-GATE.md` rewritten for the server-verified model;
   `RELEASE-NOTES.md` has an `Unreleased` entry (no version bump).
   Privacy-copy rewrite is PROPOSED ONLY (awaiting MAX's answer to (b)).

Verified this session: `swift build -c release` green; `verify_phase1.sh`
6/6 PASS (step f `LICENSE_GATE_OK`); worker `npm test` 64/64.
NOT verified: no live end-to-end check with a real license key (deliberately —
needs MAX's deployed worker + real public key + a real Gumroad key). The e2e
check script will be written when MAX confirms deployment and hands over the
public key.

## 9g. Apex domain, name cleanup, privacy copy (2026-10-12, uncommitted, nothing deployed)

- **Decision (founder):** the site goes on the apex `https://mubasharbuilds.com` in a NEW Pages project (suggested name `drift-workbench`). The old `mubasharbuilds` project is not touched. The founder does the Cloudflare login, DNS and deploy. DNS is at Spaceship and mail is on Zoho, so every record (3 Zoho MX, SPF, zoho-verification TXT, DKIM `zmail`) must be copied to the Cloudflare zone before the nameserver switch. DNSSEC is ON (DS at the registry, 86400 s TTL): remove the DS at Spaceship and wait 24 h before switching. Steps: `LAUNCH.md` in `/Users/user/Desktop/mubasharbuilds-site 2/netmax/`.
- `lib/site.ts` now defaults to the apex, so the "unclaimed placeholder" risk in section 9 no longer applies to builds. Check chain green, `NEXT_PUBLIC_SITE_URL=https://mubasharbuilds.com pnpm build` has zero warnings, no placeholder host in `out/`; against the previous build only the two privacy sentences changed.
- Go-live decisions (founder, 2026-10-12): the Pricing card carries "Not yet notarized: macOS asks you to confirm the first open." (`PRICING.note`, rendered under the price; checked at 375 and 1440, no overflow); the trial backend is real, so the site copy stands and `landing-claims.md` is stale; privacy wording kept. Still open: Gumroad listing title (dashboard).
- Live tool sweep (2026-10-13, repo server 1.0.8, scratch HOME, remote-AI settings stripped): 18 of 20 tools verified live. Not run live: `strict_limit` (root, changes system networking) and `fleet_drift_workbench` (peers must be public HTTPS, so no loopback test; its 15 unit tests pass). `dns_ranking` works now (the earlier failure was this network blocking UDP/53). `ai_analyze` dispatches 26 analyses; 12 answer a generic measurement input, the rest need analysis-specific inputs that `list_analyses` does not describe, and 3 fail with a raw Python traceback instead of a clean message. Three suites re-run green: 3 + 15 + 8.
- Privacy copy (FAQ and `/docs`) now says "trial activation and license checks, made by the desktop app". True only once the licensed app ships.
- Name cleanup, prose only: mcpb `display_name`, and the product name in `MARKETING-COPY.md`, `MCP-DIRECTORY-SUBMISSIONS.md`, `landing-claims.md` (`landing/index.html` had no prose to change). Held for the founder: `@netmax/mcp-server` in command and link rows, old tool counts, and the stale Homebrew, "Free forever", Pro-list and update-promise lines (left as they were).

## 10. First steps for the new session

1. Read `/Users/user/netmax-app/website-v3/CLAUDE.md` and `DESIGN.md`, then skim `content/copy.ts` and `components/Motion.tsx`.
2. Run the check chain and `pnpm build` from section 7 to confirm the tree is healthy. Serve `out/` and look at it.
3. **Phase 7, where it stands (2026-10-11): plan written and attacked, artifact staged, NOTHING DEPLOYED.** No wrangler is installed, there is no saved Cloudflare login and no `CLOUDFLARE_*` variable on this machine. The assistant cannot enter credentials, so the founder runs any login step, and downloading wrangler needs the founder's permission. Read the plan below before doing anything, and ask the founder for the decisions listed in it.
4. HARD RULES for Phase 7 (the guard enforces the command-level ones): never run `wrangler pages deploy` without exactly one `--project-name` and one `--branch` (wrangler infers the branch from git, and an omitted `--branch` on `main`, or outside a git repo, is a PRODUCTION deploy); never name `mubasharbuilds` in any write; never push; never promote or reuse the preview copy for production; snapshot production before and after every Cloudflare write and stop on any difference; bring the preview URL to the founder before anything goes live.

### Phase 7 plan (preview only)

**Why the preview cannot touch `mubasharbuilds.pages.dev`, including `/drift/docs/`**

1. **Different project.** The preview goes to a NEW Direct Upload Pages project, `drift-workbench-preview`. Cloudflare keeps deployments per project, and its docs state that a non-production deployment does not change a project's main `<project>.pages.dev` site or its custom domains. `/drift/docs/` is a file in the `mubasharbuilds` project's production deployment; the preview project does not contain, share or serve it. (On the preview, `/drift/docs/` correctly 404s: that is the new project, not production.)
2. **Every write goes through an allowlist, not discipline.** `deploy-kit/wr.sh` aborts if any argument IS `mubasharbuilds`, if `pages deploy` lacks exactly one literal `--project-name=drift-workbench-preview` and exactly one `--branch=v3-preview`, if the working directory is inside a git checkout or has `functions/`, `_routes.json`, `_worker.js`, `.env*` or `wrangler.*` in it or above it, if `login` has no `--scopes`, or for anything not on the list. Production gets reads only, through `wr_read_prod` (`pages project list`, `pages deployment list`). 37 tests pass in bash and zsh against a stub binary, including: a path that merely contains the text "mubasharbuilds" is allowed, a duplicated `--branch=main` is refused.
3. **No git involvement.** Wrangler runs from an empty non-git folder with explicit flags, so branch inference cannot make this a production deploy. Nothing is pushed.
4. **Build before login.** The preview was built and scanned with no Cloudflare credential on the machine. Login happens afterwards, with limited scopes, and ends with `wr logout`.
5. **Proof, not assertion.** Before and after, `baseline.py` snapshots production over HTTP (status, sha256 of each body, cache headers; a failed fetch is INVALID, never "no difference"), pinned to the research-time hashes, and no more than 5 minutes old at deploy time. The production deployment list (ids, count, newest) is read with `wr_read_prod` before and after and diffed whole. Any difference stops everything. Production hashes at research time: `/` 418b128ae124 (7,540 B, also returned for any unknown path), `/drift/` fc3b3cb94b93, `/drift/docs/` 78e9e678cf6e (4,736 B), `/drift/docs` is a 308, `/assets/site.js` 79802cc9989d, `/assets/style.css` 029030ea5294. Re-measured about 15 minutes apart: 0 differences.

**What this does NOT guarantee (tell the founder):** (a) A Cloudflare login is account-wide, so Cloudflare itself would not stop a mistyped command; only the guard does. (b) If `mubasharbuilds` is linked to the GitHub repo, a `git push` could start a production build: never push. (c) A redeploy of identical bytes is invisible over HTTP; only the deployment-list diff catches it. (d) Anyone else with account access is out of scope. (e) Production's own `_redirects`, `_headers` and Functions cannot be seen over HTTP (matters only for a future cutover). (f) Wrangler's output field names are unverified until it is installed: print key names first, assert non-empty, and never trust a comparison of empty values.

**Staged preview artifact** (`preview-out/`, 45 files, 1.6 MB, built with `NEXT_PUBLIC_SITE_URL=https://v3-preview.drift-workbench-preview.pages.dev`): placeholder host 0 hits; canonical, og:url, og:image, twitter:image and JSON-LD all use the preview alias; no secret patterns, source maps, env files or local paths; `_headers` gets `X-Robots-Tag: noindex, nofollow`, robots.txt is `Disallow: /`, no sitemap, noindex meta in `index.html`; limits far inside Pages free plan. It is for review only and is NEVER promoted: a production build is a fresh one with the real origin and none of these protections. If the project name or alias changes, rebuild (about 1 minute).

**Decisions the founder owns**

1. Approve downloading `wrangler@4.142.0`: npm registry, newest release at least 14 days old, 39 packages, about 219 MB on disk, installed into a scratch folder with `--ignore-scripts` and without `~/.npmrc`.
2. Do the Cloudflare login yourself: `wr login --scopes <smallest set; confirm from --help, expected account:read pages:write>`, and `wr logout` at the end.
3. Preview privacy: **Access-gated (recommended)** or public with noindex. The page carries three unresolved claims (section 9) and a live Gumroad link. Access is a dashboard toggle on the new project (Settings > General) and must be ON before the first upload. Sharing a link that unfurls or gets archived cannot be undone by deleting the project.
4. Project name: `drift-workbench-preview` (recommended: throwaway, keeps the final-domain decision open) or `drift-workbench` (would become the production host the placeholder canonical already names).
5. Where to keep a persistent copy of the live site (5 files) and of the deploy kit.
6. Before the deploy, in the dashboard: confirm `mubasharbuilds` lists its current production deployment with Rollback available.

**Procedure once the decisions are made** (each write step is `wr ...`; reads of production are `wr_read_prod ...`)

1. Install wrangler as in decision 1; `--version` must print 4.142.0. Founder logs in; `wr whoami` shows the right account.
2. Read-only: `wr_read_prod pages project list` must show `mubasharbuilds` and not `drift-workbench-preview`; `wr_read_prod pages deployment list --project-name=mubasharbuilds --json`: print key names, keep only id, environment, created_on and branch, assert non-empty, delete the raw JSON.
3. `baseline.py snapshot` production, then `assert-pins` against the pinned file (exit must be 0).
4. `wr pages project create drift-workbench-preview --production-branch=main`. The project's subdomain must be EXACTLY `drift-workbench-preview.pages.dev` (a random suffix means the name was taken: stop, pick another, rebuild).
5. Founder applies the Access decision (decision 3) before any upload.
6. One chained command (`&&`, so a failed check stops the deploy): `fresh` (at most 300 s) then, from the empty non-git folder, `wr pages deploy <preview-out> --project-name=drift-workbench-preview --branch=v3-preview --commit-dirty=true --commit-message='v3 preview (not for production)'` with `pipefail`. The output must name only the preview project.
7. Prove production untouched: new `baseline.py snapshot`, `compare` against step 3 (exit 0, headers included), `assert-pins`, and the whole production deployment list diffed against step 2. Prove the preview is a preview: its latest deployment is environment `preview`, branch `v3-preview`, and `https://drift-workbench-preview.pages.dev/` (the project root) does NOT serve the site.
8. Check the preview itself: `X-Robots-Tag: noindex` and the four security headers on `/`, immutable cache on a chunk, `robots.txt` Disallow, `/sitemap.xml` and `/_headers` return 404 (never the homepage), `/drift/` and `/drift/docs/` 404. If Access is on, run these through the founder's browser (an unauthenticated request should get the Access redirect).
9. `wr logout`. Give the founder the preview URL plus the proof lines from steps 7 and 8, then WAIT. No production step exists in this plan.

**Rollback:** keep the preview project (it costs nothing and keeps the name owned); to retire it, deploy a blank page to `v3-preview` and leave Access on. Deleting the project (`wr pages project delete drift-workbench-preview`) frees the name for anyone to claim and cannot recall copies already cached or archived. If production ever changes, the founder rolls back in the dashboard (Workers & Pages > mubasharbuilds > Deployments); the assistant never touches production.
