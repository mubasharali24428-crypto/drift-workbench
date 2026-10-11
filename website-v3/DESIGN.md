# DESIGN.md: Drift Workbench, Raycast-caliber direction

Direction is decided. This file records the system that implements it.
Source of truth for values: `app/globals.css` (`@theme`). Motion: `lib/motion.ts`.

## 1. Principles

1. Restraint is the premium signal. When in doubt, remove.
2. Centered, symmetric, generous whitespace. Huge display type, tight tracking.
3. One accent (signal green), one radius (10px), one glow (hero), one pinned section.
4. Hairline borders do the structural work. No shadows, no decorative gradients, no glass.
5. Every claim is backed by a measurement from the brief's evidence list. Anything simulated is labeled.

## 2. Color

All components use semantic tokens. Raw hex and Tailwind palette classes do not compile (`--color-*: initial`).

| Token | OKLCH | Resolves to | Role |
|---|---|---|---|
| `background` | `0.1541 0.0046 264.43` | `#0B0C0E` | Canvas |
| `foreground` | `0.97 0.003 260` | `#F4F5F7` | Primary text |
| `card` / `card-foreground` | `0.175 0.004 260` / `0.97 0.003 260` | `#0F1112` | Card surface |
| `muted` | `0.205 0.005 260` | `#161719` | Quiet fills (keycaps, code chips) |
| `muted-foreground` | `0.72 0.01 260` | `#A1A5AB` | Secondary text |
| `border` | `0.30 0.006 260` | `#2C2E31` | Hairline separators (decorative) |
| `border-strong` | `0.50 0.008 260` | n/a | Outlines of interactive controls |
| `accent` | `0.7227 0.192 149.58` | `#22C55E` | The only accent |
| `accent-foreground` | `0.1541 0.0046 264.43` | `#0B0C0E` | Text on accent |
| `ring` | `0.7227 0.192 149.58` | `#22C55E` | Focus ring |
| `destructive` | `0.68 0.19 25` | n/a | Error states only. Never decorative. One approved exception: the failing grade "F" in the terminal readouts (a failing grade in the success color would mislead). Approved by the founder in Phase 3. |

### Contrast (computed from the token values with a WCAG 2.x script)

| Pair | Ratio | Requirement | Result |
|---|---|---|---|
| foreground on background | 17.9:1 | 4.5:1 | Pass |
| muted-foreground on background | 7.9:1 | 4.5:1 | Pass |
| muted-foreground on card | 7.7:1 | 4.5:1 | Pass |
| muted-foreground on muted | 7.2:1 | 4.5:1 | Pass |
| accent on background | 8.6:1 | 4.5:1 text, 3:1 UI | Pass |
| accent on card | 8.3:1 | 4.5:1 | Pass |
| accent-foreground on accent | 8.6:1 | 4.5:1 | Pass |
| destructive on background | 6.2:1 | 4.5:1 | Pass |
| border-strong on background | 3.3:1 | 3:1 UI | Pass |
| border on background | 1.4:1 | Not required (decorative) | Hairline only, never the sole boundary of a control |

These are calculations, not browser measurements. Re-check in Phase 6 with the rendered page.

### Accent usage (allowed list)

The primary CTA, key data readouts in the terminal, the focus ring, text selection, and the single hero glow. Nothing else is green.

## 3. Type

| Family | Token | Role |
|---|---|---|
| Space Grotesk | `font-display` | Headlines only (h1 to h3) |
| Inter | `font-sans` | Body and UI |
| JetBrains Mono | `font-mono` | Commands, tool names, readout labels only |

| Token | Size | Line height | Tracking |
|---|---|---|---|
| `text-display-xl` | `clamp(3.5rem, 8vw, 8rem)` | 0.95 | -0.045em |
| `text-display-lg` | `clamp(2.5rem, 5.5vw, 5rem)` | 1.0 | -0.04em |
| `text-display-md` | `clamp(2rem, 4vw, 3.25rem)` | 1.05 | -0.035em |
| `text-heading` | `clamp(1.375rem, 2.2vw, 1.75rem)` | 1.2 | -0.02em |
| `text-body-lg` | `clamp(1.0625rem, 1.4vw, 1.25rem)` | 1.55 | 0 |
| `text-body` | `1rem` | 1.6 | 0 |
| `text-small` | `0.875rem` | 1.5 | 0 |
| `text-mono` | `0.8125rem` | 1.5 | 0 |
| `text-mono-sm` | `0.75rem` | 1.5 | 0 |

`text-mono-sm` is used only for the terminal body below `md`, so 41-character lines stay on one line at 375px.

Rules: sentence case everywhere, no all-caps labels. Body line length under 70 characters. Headlines use `text-wrap: balance`. Headlines are plain foreground color: no gradient text. The only colored word allowed is "Fix that." in the hero h1, per the brief.

## 4. Space and layout

- 4px base unit (`--spacing: 0.25rem`).
- 12-column grid, `max-w-page` (1200px) for content, `max-w-wide` (1280px) for the grid and terminal.
- Section padding: 128px vertical on desktop, 80px on mobile. Sections are separated by whitespace and, where needed, a single hairline.
- Composition is centered. Left-aligned text appears only inside cards, the transcript, the FAQ and the terminal.
- Targets are at least 44px on touch.

## 5. Surface and depth

- One radius, 10px, on every bordered container, button and input. All Tailwind radius steps resolve to 10px.
- Cards: `bg-card`, 1px `border-border`, no shadow.
- Interactive controls (command bar, buttons, accordion triggers): 1px `border-strong`.
- Terminal chrome traffic-light dots are inline SVG circles, treated as glyphs, not containers.
- The hero glow is `.ambient-glow`, a single radial wash at 14% accent. Used once.

## 6. Components

- **Command bar**: a ⌘K-style entry. Mono command, a copy button, a keyboard hint where honest. Copy confirmation changes the icon and label in place. No toast.
- **Tool card**: mono tool name, one-line description in `muted-foreground`. No icon per card, no hover lift. Hover changes the border to `border-strong` only.
- **Readout**: mono sentence-case label, display-weight value.
- **Accordion** (FAQ): shadcn primitive, restyled to tokens.
- **Icons**: Lucide plus inline SVG. No emoji.

## 7. Motion

All values live in `lib/motion.ts`. Slow, confident, no overshoot.

- Reveal: opacity plus 12px rise, 0.9s `power3.out`, once, on section headline blocks and grid containers only. No per-card stagger.
- Hero parallax: terminal rises up to 48px across the hero, transform only.
- One pinned section: detect, explain, prove, export, four steps.
- State changes: 180ms, color and border only. No scale, no translate on hover.
- Lenis: lerp 0.08, not initialised under `prefers-reduced-motion`.
- Reduced motion: no parallax, no pin (the four steps render stacked), no reveals, no Lenis. A global CSS fallback zeroes transitions.
- Content is visible without JavaScript. Hidden initial states are set by script.

## 8. Decisions I made that you should confirm

1. **Added `border-strong`.** The brief's token list has no value for control outlines, and the hairline `border` is only 1.4:1 against the canvas, which fails the 3:1 UI rule for the command bar and buttons. `border-strong` is 3.3:1.
2. **`--color-*: initial`.** This strips Tailwind's default palette so the "no palette classes" rule is enforced by the build. It also means utilities like `text-white` or `bg-black` do not exist.
3. **`--shadow-*` and `--blur-*` stripped.** Shadows and backdrop blur cannot be used by accident. Gradient utilities cannot be stripped this way, so they are caught by the grep check in CLAUDE.md.
4. **Eyebrow appears once**, in the hero ("Drift Workbench · Private preview"), as the brief specifies. Other sections get no eyebrow.
5. **Sentence-case mono labels** in the readout strip, rather than all-caps.
6. **Reveals are restrained** compared with a typical fade-up-everything page: headline blocks and grids only.

## 9. Not yet verified

- ~~That `--color-*: initial`, the radius overrides and the `--text-*--letter-spacing` pairs compile as intended.~~ Confirmed in Phase 3: the built CSS contains the token utilities and `rounded-md` resolves to `--radius-md`.
- Rendered contrast in a browser.
- Whether the pinned section and Lenis fit inside the 150KB gzipped JS budget.
