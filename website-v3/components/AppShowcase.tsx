import { APP } from "@/content/copy";

export function AppShowcase() {
  return (
    <section id="app" className="px-4 py-20 sm:px-6 md:py-32">
      <div className="mx-auto max-w-page">
        <h2 className="mx-auto max-w-3xl text-center font-display text-display-lg font-semibold">
          {APP.heading}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-center text-body-lg text-muted-foreground">
          {APP.body}
        </p>
        <figure className="mt-12 md:mt-16">
          <div data-app-window className="overflow-hidden rounded-md border border-border">
            {/* Static export without an image loader: a plain img keeps the build warning-free. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/app-dashboard.png"
              alt={APP.alt}
              width={1372}
              height={895}
              loading="lazy"
              decoding="async"
              className="block h-auto w-full"
            />
          </div>
          <figcaption className="mt-4 text-center text-small text-muted-foreground">
            {APP.caption}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
