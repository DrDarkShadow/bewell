import HeroSection from "@/components/hero-section"
import DualAgentSection from "@/components/dual-agent-section"
import JourneySection from "@/components/journey-section"
import TrustSection from "@/components/trust-section"
import CTASection from "@/components/cta-section"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />
      <DualAgentSection />
      <JourneySection />
      <TrustSection />
      <CTASection />
    </main>
  )
}
