import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

/*
 * Variable fonts, latin subset, display:swap.
 * Space Grotesk: display headlines only.
 * Inter: body and UI.
 * JetBrains Mono: commands, tool names, readout labels only.
 */

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

/** Apply to <html className={fontVariables}> in app/layout.tsx. */
export const fontVariables = [spaceGrotesk.variable, inter.variable, jetbrainsMono.variable].join(
  " ",
);
