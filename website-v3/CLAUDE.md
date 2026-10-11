# CLAUDE.md: Drift Workbench marketing site (Raycast-caliber redesign)

Every action in this repo complies with this file. If a request conflicts with it, say so before acting.

## What this is

A redesign of the v2 marketing site. v2 is a content and copy reference only. The design system is replaced. Job of the site: credibility for startup-program reviewers (Cloudflare for Startups, YC, a16z speedrun, SPC, Antler, Techstars). Public launch is paused. Frame as private preview. Never fake traction.

Product: Drift Workbench, a local-first network diagnostics toolkit. A 20-tool MCP server (`npx -y @drift-workbench/mcp-server`) that AI coding agents call directly, plus a macOS desktop app that exports timestamped evidence reports.

## Direction (decided, do not propose alternatives)

- Canvas near-black `#0B0C0E`. One accent, signal green `#22C55E`. Centered composition, huge display type, tight tracking.
- Type: Space Grotesk (display), Inter (body), JetBrains Mono (commands, tool names, readout labels only).
- Hero: a giant macOS-chrome terminal running a real diagnosis, over the one ambient glow.
- Install command presented as a ⌘K-style command bar with copy.
- Ecosystem grid: the 20 MCP tools as store-style cards. Real names only.
- Exactly one glow, one pinned section, one accent, one radius (10px), one display font.
- Hairline borders. No shadows, no decorative gradients, no glassmorphism.

## Tokens

Defined in `app/globals.css` `@theme`, documented in `DESIGN.md`. Use semantic tokens only: `background, foreground, muted, muted-foreground, border, border-strong, card, card-foreground, accent, accent-foreground, ring, destructive`. No raw hex, no palette classes, no hardcoded values in components.

## Motion config

Source of truth: `lib/motion.ts`. Slow, confident. Gentle hero parallax, soft once-only reveals, zero typing effects, zero bounce, no hover scale. `prefers-reduced-motion` fully honored: no parallax, no pin, no reveals, no Lenis. Content must be visible without JavaScript.

## Stack

Next.js 15+ App Router, React 19, TypeScript strict, `output: 'export'` for Cloudflare Pages, Tailwind v4 CSS-first, shadcn/ui primitives, Lucide plus inline SVG, GSAP 3.13 + ScrollTrigger + `@gsap/react`, Motion v11+ (use `LazyMotion` and `m`), Lenis, Plausible, pnpm. Fonts via `next/font/google` (`app/fonts.ts`). No other UI kits, no CSS-in-JS, no 3D.

Load GSAP and ScrollTrigger dynamically, only where the pinned section needs them.

## Honest limits (binding)

MAY claim:
- The 20 tools by name, read from the MCP server source.
- The install command, exactly: `npx -y @drift-workbench/mcp-server`
- Local-first, zero telemetry, no accounts.
- QA: 50/50 parallel probes clean, 100-probe soak +0.1MB, 8/8 fault tests honest with zero fabricated values, 16/16 Linux unit tests.
- Measured local run: 0.0% packet loss; bufferbloat idle 63.8 ms, loaded +542.6 ms, grade F.
- Trial: hardware-bound (SHA-256 of machine UUID), server-verified, 14-day token, fail-closed, VMs denied.
- One pricing tier: $29 Founding License (macOS 13+, Gumroad). MCP server free.
- npm badge `@drift-workbench/mcp-server@1.0.7`, only after `npm view @drift-workbench/mcp-server version` confirms it.
- Windows: "Windows probe parsers validated against real Windows 11 captures."

MUST NOT claim: user counts, revenue, logos, press, testimonials; "full Windows support"; any Homebrew command; extra pricing tiers.

BANNED words in marketing copy: speed, boost, turbo, ultra, hyper, fast, quick, "Max", seamless, robust, cutting-edge, revolutionize, empower, unlock, next-generation, game-changing, best-in-class, leverage. No "AI-powered X for Y". A real tool identifier may appear verbatim in mono as a name, never as a claim.

The GitHub URL comes from `git -C /Users/user/netmax-app remote get-url github`. Never typed from memory. Anything simulated is labeled simulated (the agent transcript carries an "Illustrated" label).

## Prohibitions

No gradient text, glassmorphism, card shadows, three identical cards, emoji icons, stock photos, lorem ipsum, fake proof. No `any`, no `console.log`, no hardcoded tokens. No consulting-firm aesthetic ("solutions" language, Calendly-style CTAs). The glow appears once. One pinned section. No testimonials, logo walls, blog or industries pages.

## Quality gates

- WCAG 2.2 AA: one h1, visible focus rings, 4.5:1 body and 3:1 UI, skip link, reduced motion, labeled forms, targets at least 44px.
- Lighthouse 95+ on all four. LCP under 2.0s, CLS under 0.05, INP under 200ms. JS under 150KB gzipped.
- Static export builds with zero warnings.
- SEO: metadata per route, OG and Twitter cards, JSON-LD (Organization and SoftwareApplication with the real npm URL), sitemap, robots, canonicals.
- Responsive 375 to 1920 with no horizontal overflow.
- TypeScript strict, ESLint and Prettier clean, components under 150 lines.
- Playwright screenshots of every section at 375, 768 and 1440 before declaring done.

## Commands

```
pnpm dev
pnpm build        # static export; must finish with zero warnings
pnpm lint
pnpm typecheck
pnpm check:prohibited
```

`check:prohibited` fails on any match in `app/`, `components/` or `lib/`:

```
rg -n "bg-(gradient|linear|radial|conic)|\b(from|via|to)-|shadow-|backdrop-|rounded-full|console\.log|: any\b|lorem" app components lib
```

Gradient utilities cannot be stripped from the Tailwind theme, so this grep is the guard. Allow-list `.ambient-glow` in `globals.css` only.

## Workflow

Phases, each ending with a pause for approval:
1. Confirmation (done).
2. Foundations: `CLAUDE.md`, `DESIGN.md`, `@theme` tokens, fonts, `lib/motion.ts`.
3. Hero, screenshots at 1440 and 375.
4. Sections in order, two sentences per section, then wait.
5. Motion pass.
6. Quality gates, including `npm view` for the version and a character-for-character check of the install command.
7. Deploy prep for Cloudflare Pages.

When uncertain, choose the more restrained, more specific, more confident option. When in doubt, remove.
