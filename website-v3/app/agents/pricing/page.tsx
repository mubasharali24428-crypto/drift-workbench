import type { Metadata } from "next";
import { AgentsPricing } from "@/components/AgentsPricing";
import { Footer } from "@/components/Footer";
import {
  AGENTS_PRICING_JSON_PATH,
  AGENTS_PRICING_META,
  AGENTS_PRICING_PATH,
} from "@/content/agents-pricing";
import { SITE } from "@/lib/site";

// Child metadata replaces the layout's openGraph and twitter objects, so both are restated.
const IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Drift Workbench: your AI agent is blind to the network. Fix that.",
};

export const metadata: Metadata = {
  title: AGENTS_PRICING_META.title,
  description: AGENTS_PRICING_META.description,
  alternates: {
    canonical: AGENTS_PRICING_PATH,
    types: { "application/json": AGENTS_PRICING_JSON_PATH },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: AGENTS_PRICING_META.title,
    description: AGENTS_PRICING_META.description,
    url: AGENTS_PRICING_PATH,
    images: [IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: AGENTS_PRICING_META.title,
    description: AGENTS_PRICING_META.description,
    images: [IMAGE.url],
  },
};

export default function AgentsPricingPage() {
  return (
    <>
      <main id="main">
        <AgentsPricing />
      </main>
      <Footer />
    </>
  );
}
