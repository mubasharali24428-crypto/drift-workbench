/*
 * Motion config. Slow, confident, no overshoot, no bounce, no typing effects.
 * Pure constants: no library imports, so importing this never adds bundle weight.
 * All motion code reads from here. No inline durations or easings elsewhere.
 */

type Bezier = [number, number, number, number];

/** Easings for Motion (cubic-bezier tuples). Neither overshoots. */
export const ease = {
  out: [0.22, 1, 0.36, 1] as Bezier,
  inOut: [0.65, 0, 0.35, 1] as Bezier,
};

/** Easing for GSAP. */
export const gsapEase = {
  out: "power3.out",
  inOut: "power2.inOut",
} as const;

/** Seconds. */
export const duration = {
  state: 0.18, // hover, focus, copy-confirm: color and border only
  base: 0.5,
  reveal: 0.9,
  hero: 1.2,
} as const;

/**
 * Scroll reveal: opacity plus a 12px rise, once, never repeated.
 * Applied to section headline blocks and grid containers only.
 * No per-card stagger. Content must be visible without JS: the hidden
 * initial state is set by script, never by CSS.
 */
export const reveal = {
  y: 12,
  duration: duration.reveal,
  start: "top 85%",
} as const;

/** Hero visual parallax: transform only (no layout shift), gentle. */
export const parallax = {
  /** Total upward travel of the terminal across the hero, in px. */
  distance: 48,
  scrub: 0.6,
} as const;

/** App window entrance: rises and settles into full size as it scrolls into view. Transform only. */
export const appWindow = {
  y: 56,
  scale: 0.94,
  scrub: 0.6,
  start: "top 95%",
  end: "top 35%",
} as const;

/** The one pinned section: detect, explain, prove, export. */
export const pinned = {
  steps: 4,
  /** Scroll distance per step, as a percentage of viewport height. */
  vhPerStep: 70,
  scrub: 0.5,
} as const;

/** Lenis smooth scroll. Not initialised under reduced motion. */
export const lenis = {
  lerp: 0.08,
  wheelMultiplier: 0.9,
  smoothWheel: true,
} as const;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Client-only. Returns true on the server so SSR output stays static. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Shared Motion transition for component-level state changes. */
export const stateTransition = {
  duration: duration.state,
  ease: ease.out,
} as const;
