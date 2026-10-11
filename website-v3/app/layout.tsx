import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { SITE } from "@/lib/site";
import { fontVariables } from "./fonts";
import "./globals.css";

const TITLE = "Drift Workbench: network diagnostics your AI coding agent can run itself";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: TITLE,
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: TITLE,
    description: SITE.description,
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Drift Workbench: your AI agent is blind to the network. Fix that.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE.description,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Nav />
        {children}
      </body>
    </html>
  );
}
