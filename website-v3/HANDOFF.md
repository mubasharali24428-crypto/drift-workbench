# DRIFT WORKBENCH WEBSITE: SESSION HANDOFF (paste this into the new chat)

You are joining a project mid-flight. Read this fully, then do "First steps" at the bottom. Do not rebuild anything marked done.

## 1. Goal

A Raycast-caliber marketing site for **Drift Workbench** (network diagnostics your AI coding agent can run itself), the centerpiece of startup-program applications (Cloudflare for Startups, YC, a16z speedrun, SPC, Antler, Techstars). Job: CREDIBILITY for reviewers. Public launch is paused, so everything is framed as private preview / founding cohort. Never fake traction. Ships as a static export to Cloudflare Pages.

When uncertain, choose the more restrained, more specific, more confident option. When in doubt, remove.

## 2. Where everything is

- **Active build (v3): `/Users/user/netmax-app/website-v3/`**. Next.js 15, React 19, Tailwind v4, static export. Not committed to git (untracked inside `/Users/user/netmax-app`).
- `website-v3/CLAUDE.md` and `website-v3/DESIGN.md`: the governing rules and design system. READ BOTH FIRST. Tokens live in `app/globals.css`, motion constants in `lib/motion.ts`, fonts in `app/fonts.ts`.
- **v2 site (copy reference only, do not rebuild): `/Users/user/netmax-app/website`** (identical snapshot in `website-v2-snapshot`).
- **Phase 4 inputs (approved copy): `/Users/user/drift-workbench-phase4-inputs.txt`**. Has the 20 tool names and descriptions, the 5 FAQ Q&As (verbatim) and the agent transcript. Use it, don't mine v2.
- MCP server source (ground truth for tools): `/Users/user/netmax-app/desktop/netmax-mcp-server.mjs`.
- Phase 2 foundation zip (already copied into v3): `~/Desktop/files.zip`.
- Original build prompt (history only): `~/Desktop/drift-workbench-website-build-prompt1.md`. It conflicts with the current direction (left-aligned hero, 2px radius, #0B1120). The CURRENT direction wins: centered, 10px radius, #0B0C0E.
- **The Raycast-direction master prompt is NOT on this machine.** It lives in a claude.ai chat under another email. `CLAUDE.md` + `DESIGN.md` in v3 are the approved distillation. Do not ask for it again unless a spec question can't be answered from them.

## 3. Status

- **Phase 1 (confirmation): done.**
- **Phase 2 (foundations): done, approved.** Tokens in OKLCH, `--color-*: initial` strips the default palette, one radius (10px), `border-strong` added for 3:1 control outlines.
- **Phase 3 (hero): done, APPROVED.** Centered hero, headline "Your AI agent is blind to the network. Fix that." (green accent), `CommandBar` (install command + copy), giant `Terminal` with REAL values (packet_loss target 1.1.1.1 count 10 loss 0.0%; bufferbloat idle 63.8 ms, loaded +542.6 ms, grade F), Gumroad $29 link, `Nav` with mobile overlay, `ReadoutStrip` (20 / 0 / 0 / 100%).
- **Phase 4 (sections): in progress.**
  - Done: nav, readout strip, **ecosystem grid** (`components/ToolGrid.tsx`, `#tools`, 20 cards, 4/2/1 columns). Built and screenshot-verified, **awaiting founder approval.**
  - Remaining, in order: How it works (`#how`), pinned deep-dive (detect, explain, prove, export), agent transcript (labelled "Illustrated flow"), metrics ("Measured, not marketed."), pricing (ONE $29 tier, `#pricing`), FAQ (5 Q&As), final CTA, footer (npm v1.0.7 badge + GitHub link).
- **Phase 5 (motion pass), 6 (quality gates), 7 (Cloudflare Pages deploy prep): not started.**

## 4. Decisions already made (do not re-litigate)

1. Grade "F" is red (`text-destructive`). One documented exception to "destructive = errors only" (in DESIGN.md).
2. No Docs link in the nav until the founder decides what to do with `/drift/docs/` (it 404s in the new build). Nav anchors `#how` and `#pricing` are dead until those sections exist.
3. Terminal is one value per line, with a `text-mono-sm` token (0.75rem) below `md`, so it never wraps at 375.
4. Tool descriptions: verbatim from the inputs file EXCEPT three, edited by one word because the originals contained banned words:
   - `eco_bloat`: "Bufferbloat estimate using ~100KB of data" (was "Quick bufferbloat…")
   - `diagnostic_summary`: "Network health overview" (was "Quick network health overview")
   - `boost`: "Baseline vs multi-stream gain percentage" (was "…turbo gain…")
   **OPEN: the founder has not yet ruled on these three edits.** Ask first thing. All in `content/copy.ts`, one line each to revert.
5. "Speed" appears in two approved descriptions ("Upload speed in Mbps", "Speed, DNS, bloat…"). Kept verbatim as a measurement noun, not a claim.
6. Grid heading/subhead is my wording (inputs file had none): "Twenty tools your agent can call." / "One install registers all of them. Every name below is read from the MCP server source." Founder can change it.
7. The founder confirmed in a real browser that Copy works and `npx -y @drift-workbench/mcp-server` runs (v1.0.7, 20 tools registered). `npm view @drift-workbench/mcp-server version` returned 1.0.7 on 2026-10-11.
8. Hero terminal shows only the first banner line of the real server output (no engine path, no Python path, to avoid leaking local machine details).

## 5. Binding constraints (full list in CLAUDE.md; these are the ones that bite)

- No invented users, revenue, logos, press, testimonials or metrics. Only the verified numbers: 20 tools; 50/50 parallel probes; 100-probe soak +0.1MB; 8/8 fault tests, zero fabricated values; 16/16 Linux unit tests; the one measured run above.
- Install command exactly `npx -y @drift-workbench/mcp-server`, everywhere.
- Banned as marketing claims: speed, boost, turbo, ultra, hyper, fast, quick, "Max", seamless, robust, cutting-edge, revolutionize, empower, unlock, next-generation, game-changing, best-in-class, leverage. No "AI-powered X for Y". Tool identifiers (`boost`, `measure_speed`) may appear in mono as names only.
- One accent (green), one radius (10px), one glow (hero only), one pinned section, one display font. No shadows, gradients (except the glow), glassmorphism, emoji. Semantic tokens only; no raw hex or palette classes.
- Windows wording: "Windows probe parsers validated against real Windows 11 captures." Never "full Windows support". No Homebrew command. One pricing tier ($29 Founding License, macOS 13+, Gumroad); MCP server is free.
- GitHub URL only from `git -C /Users/user/netmax-app remote get-url github` (currently `https://github.com/mubasharali24428-crypto/netmax.git`; repo still has the old name, keep linking it honestly). Anything simulated is labelled simulated.
- If a request would violate these or CLAUDE.md, flag the conflict instead of complying.

## 6. How we work

- Phase approval gates. In Phase 4: build one section, screenshot at **375 / 768 / 1440**, give a **two-sentence report**, then WAIT.
- Playwright is not installed. Use the built-in browser pane: serve `out/` and use `resize_window` plus screenshots.
- The user's global `/Users/user/CLAUDE.md` also applies: print an `Assumptions:` line before writing code, a numbered plan (`step → verify: check`) for multi-step work, name the exact verification you ran before claiming done, keep diffs surgical, and stop and ask when a rule and a request conflict.
- Model routing (from the brief): the cheap model is fine for sections; use the stronger model for the Phase 5 motion pass and any weak section.

## 7. Commands and gotchas

```
cd /Users/user/netmax-app/website-v3
pnpm typecheck
pnpm build                  # static export to out/, must have zero warnings
pnpm check:prohibited       # rg guard; silent + exit 0 = clean
cd out && python3 -m http.server 8811 --bind 127.0.0.1
```

- `pnpm build` deletes and recreates `out/`. Restart the http server after every build or it serves nothing.
- The guard regex flags `\b(from|via|to)-` anywhere in `app/ components/ lib/`. Do not write strings like `skip-to-content` in code.
- To scroll to a section in the browser pane use `element.scrollIntoView()`, not `offsetTop`.
- Not installed or set up yet: ESLint/Prettier (`pnpm lint` doesn't exist), GSAP, Motion, Lenis, Plausible, shadcn. Add each only when a section needs it (no unused dependencies). The FAQ can be native `<details>`/shadcn Accordion per DESIGN.md.

## 8. Not yet verified

- Lighthouse (all four categories >= 95), bundle size vs 150KB gzipped budget (currently ~103 kB first-load JS).
- Rendered contrast in a browser (DESIGN.md contrast table is computed, not measured).
- JSON-LD, sitemap, robots, OG image, canonicals (Phase 7).
- Reduced-motion behavior (no motion exists yet).

## 9. Open founder items (not yours to decide)

- `/drift/docs/` 404s in the new build: port the real docs from the old static site, or keep the link out.
- GitHub remote still named `netmax`.
- Gumroad listing still reads "NetMax Desktop Pro". The founder's dashboard fix.
- Final site URL / domain (v3 uses the Cloudflare Pages default host placeholder from `lib/site.ts`).
- Finished code is copied OUT to `/Users/user/netmax-app/website-v3/` already; deploy happens from there after Phase 6.

## 10. First steps for the new session

1. Read `/Users/user/netmax-app/website-v3/CLAUDE.md` and `DESIGN.md`, then `content/copy.ts` and `components/ToolGrid.tsx`.
2. Run `pnpm typecheck`, `pnpm build`, `pnpm check:prohibited` to confirm the tree is healthy. Serve `out/` and look at it.
3. Report in 3 lines: tree healthy or not, then ask the founder (a) to approve the ecosystem grid and (b) to rule on the three one-word description edits.
4. On approval, build **How it works** next: Install, Baseline, Prove as a numbered vertical sequence (copy basis: `npx -y @drift-workbench/mcp-server` / "20 probes set what normal looks like" / "3 consecutive breaches confirm drift"), NOT three identical cards. Screenshot at 375/768/1440, two-sentence report, wait.
