import type { Metadata } from "next";
import { Changelog } from "@/components/Changelog";
import { Footer } from "@/components/Footer";
import { CHANGELOG } from "@/content/changelog";
import { SITE } from "@/lib/site";

// Child metadata replaces the layout's openGraph and twitter objects, so both are restated.
const IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Drift Workbench: your AI agent is blind to the network. Fix that.",
};

export const metadata: Metadata = {
  title: CHANGELOG.metaTitle,
  description: CHANGELOG.metaDescription,
  alternates: { canonical: "/changelog" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: CHANGELOG.metaTitle,
    description: CHANGELOG.metaDescription,
    url: "/changelog",
    images: [IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: CHANGELOG.metaTitle,
    description: CHANGELOG.metaDescription,
    images: [IMAGE.url],
  },
};

export default function ChangelogPage() {
  return (
    <>
      <main id="main">
        <Changelog />
      </main>
      <Footer />
    </>
  );
}
