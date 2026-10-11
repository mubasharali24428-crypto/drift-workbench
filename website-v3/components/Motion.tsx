"use client";

import { useEffect } from "react";
import "lenis/dist/lenis.css";
import { gsapEase, lenis, parallax, pinned, prefersReducedMotion, reveal } from "@/lib/motion";

// Renders nothing. Loads GSAP, ScrollTrigger and Lenis after mount, so none of it is in
// the first-load bundle. Under reduced motion it does nothing: the page stays static.
const PIN_QUERY = "(min-width: 768px) and (min-height: 800px)";

export function Motion() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const smooth = new Lenis({ ...lenis, anchors: true });
      smooth.on("scroll", ScrollTrigger.update);
      const tick = (t: number) => smooth.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const mm = gsap.matchMedia();
      const ctx = gsap.context(() => {
        // Once-only reveals on headline blocks and grids. Anything already in view is left alone.
        gsap.utils
          .toArray<HTMLElement>("main > section[id]:not(#deep-dive) > div > *")
          .filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.85)
          .forEach((el) =>
            gsap.from(el, {
              opacity: 0,
              y: reveal.y,
              duration: reveal.duration,
              ease: gsapEase.out,
              scrollTrigger: { trigger: el, start: reveal.start, once: true },
            }),
          );

        const terminal = document.querySelector("[data-parallax]");
        if (terminal) {
          gsap.to(terminal, {
            y: -parallax.distance,
            ease: "none",
            scrollTrigger: {
              trigger: terminal,
              start: "top bottom",
              end: "bottom top",
              scrub: parallax.scrub,
            },
          });
        }

        // The one pinned section. Small or short viewports keep the four steps stacked.
        mm.add(PIN_QUERY, () => {
          const pin = document.querySelector<HTMLElement>("#deep-dive > div");
          const steps = gsap.utils.toArray<HTMLElement>("#deep-dive li").slice(1);
          if (!pin || !steps.length) return;
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: pin,
              start: "top 80px",
              end: `+=${pinned.steps * pinned.vhPerStep}%`,
              pin: true,
              scrub: pinned.scrub,
            },
          });
          steps.forEach((el) => tl.from(el, { opacity: 0, y: reveal.y }));
        });
      });

      window.addEventListener("load", () => ScrollTrigger.refresh());
      cleanup = () => {
        ctx.revert();
        mm.revert();
        gsap.ticker.remove(tick);
        smooth.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
