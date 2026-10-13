import { AppShowcase } from "@/components/AppShowcase";
import { DeepDive } from "@/components/DeepDive";
import { Faq } from "@/components/Faq";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { SITE } from "@/lib/site";
import { Transcript } from "@/components/Transcript";
import { Metrics } from "@/components/Metrics";
import { Motion } from "@/components/Motion";
import { Pricing } from "@/components/Pricing";
import { ReadoutStrip } from "@/components/ReadoutStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { ToolGrid } from "@/components/ToolGrid";

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      sameAs: [SITE.repoUrl, SITE.npmUrl],
    },
    {
      "@type": "SoftwareApplication",
      name: `${SITE.name} MCP server`,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any system that runs Node.js",
      softwareVersion: SITE.npmVersion,
      url: SITE.npmUrl,
      downloadUrl: SITE.npmUrl,
      description: SITE.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export default function Page() {
  return (
    <>
      <main id="main">
        <Hero />
        <ReadoutStrip />
        <ToolGrid />
        <HowItWorks />
        <AppShowcase />
        <DeepDive />
        <Transcript />
        <Metrics />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <Motion />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
    </>
  );
}
