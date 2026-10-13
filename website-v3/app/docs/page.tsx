import type { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { Footer } from "@/components/Footer";
import { DOCS } from "@/content/copy";
import { SITE } from "@/lib/site";

// Child metadata replaces the layout's openGraph and twitter objects, so both are restated.
const IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Drift Workbench: your AI agent is blind to the network. Fix that.",
};

export const metadata: Metadata = {
  title: DOCS.metaTitle,
  description: DOCS.metaDescription,
  alternates: { canonical: "/docs" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: DOCS.metaTitle,
    description: DOCS.metaDescription,
    url: "/docs",
    images: [IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: DOCS.metaTitle,
    description: DOCS.metaDescription,
    images: [IMAGE.url],
  },
};

export default function DocsPage() {
  return (
    <>
      <main id="main">
        <Docs />
      </main>
      <Footer />
    </>
  );
}
