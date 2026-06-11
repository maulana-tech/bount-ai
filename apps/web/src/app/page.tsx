import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Stack } from "@/components/landing/Stack";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/Footer";

/**
 * Landing page. Smooth scroll via Lenis; reveal halus per section.
 * Mengikuti UI_GUIDE: warm paper, aksen bronze, CornerFrame, tanpa
 * gradient/emoji. Dashboard ada di /app.
 */
export default function LandingPage() {
  return (
    <SmoothScroll>
      <Navbar variant="landing" />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Stack />
      <CTA />
      <Footer />
    </SmoothScroll>
  );
}
