import {
  AGENT_PRICING,
  AGENTS_PRICING_JSON_PATH,
  AGENTS_PRICING_META,
  type Plan,
} from "@/content/agents-pricing";
import { PRICING } from "@/content/copy";

const CARD = "rounded-md border border-border bg-card p-6 sm:p-8";
const LINK =
  "whitespace-nowrap text-foreground underline decoration-border-strong underline-offset-4 transition-colors duration-180 hover:decoration-foreground";
const BILLING = { free: "free", trial: "trial", "one-time": "one-time payment" } as const;

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <section id={plan.id} className={`${CARD} scroll-mt-20`}>
      <p className="font-mono text-mono text-muted-foreground">{plan.name}</p>
      <p className="mt-2 font-display text-heading font-semibold">
        ${plan.price}{" "}
        <span className="text-body font-normal text-muted-foreground">{BILLING[plan.billing]}</span>
      </p>
      <p className="mt-4 text-body text-muted-foreground">{plan.summary}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-body text-muted-foreground">
        {plan.includes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {plan.install && (
        <pre className="mt-4 whitespace-pre-wrap break-words rounded-md border border-border bg-background p-4 font-mono text-mono-sm text-foreground sm:text-mono">
          <code>{plan.install}</code>
        </pre>
      )}
      {plan.purchase && (
        <p className="mt-4 text-body text-muted-foreground">
          {plan.purchase.method}.{" "}
          <a href={plan.purchase.url} className={LINK}>
            {PRICING.cta}
          </a>
        </p>
      )}
    </section>
  );
}

// Schema.org description of the same plans, so crawlers and agents that read JSON-LD get them too.
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: AGENT_PRICING.product.name,
  description: AGENT_PRICING.product.description,
  url: AGENT_PRICING.product.url,
  offers: AGENT_PRICING.plans.map((p: Plan) => ({
    "@type": "Offer",
    name: p.name,
    description: p.summary,
    price: String(p.price),
    priceCurrency: AGENT_PRICING.currency,
    ...(p.purchase ? { url: p.purchase.url } : {}),
  })),
};

export function AgentsPricing() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
      />
      <header className="px-4 pb-10 pt-20 text-center sm:px-6 md:pt-32">
        <h1 className="mx-auto max-w-3xl font-display text-display-md font-semibold">
          {AGENTS_PRICING_META.heading}
        </h1>
        <p className="mx-auto mt-6 max-w-prose text-body-lg text-muted-foreground">
          {AGENTS_PRICING_META.sub}
        </p>
        <p className="mx-auto mt-4 max-w-prose text-small text-muted-foreground">
          {AGENT_PRICING.status}
        </p>
      </header>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-20 sm:px-6 md:pb-32">
        {AGENT_PRICING.plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
        <section id="agent-payments" className={`${CARD} scroll-mt-20`}>
          <h2 className="font-display text-heading font-semibold">Agent payments</h2>
          <p className="mt-4 text-body text-muted-foreground">
            {AGENT_PRICING.agent_payments.note}
          </p>
        </section>
        <section id="json" className={`${CARD} scroll-mt-20`}>
          <h2 className="font-display text-heading font-semibold">As JSON</h2>
          <p className="mt-4 text-body text-muted-foreground">
            The same data, generated from the same source:{" "}
            <a href={AGENTS_PRICING_JSON_PATH} className={LINK}>
              {AGENTS_PRICING_JSON_PATH}
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
