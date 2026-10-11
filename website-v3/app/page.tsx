import { Hero } from "@/components/Hero";
import { ReadoutStrip } from "@/components/ReadoutStrip";
import { ToolGrid } from "@/components/ToolGrid";

export default function Page() {
  return (
    <main id="main">
      <Hero />
      <ReadoutStrip />
      <ToolGrid />
    </main>
  );
}
