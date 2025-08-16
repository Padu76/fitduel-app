// src/app/page.tsx
import HeroSection from '@/components/landing/HeroSection'
import GameModesSection from '@/components/landing/GameModesSection'
import BattlePassSection from '@/components/landing/BattlePassSection'
import LiveFeedSection from '@/components/landing/LiveFeedSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import { CTASection, FooterSection } from '@/components/landing/CTAFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <HeroSection />
      <GameModesSection />
      <BattlePassSection />
      <LiveFeedSection />
      <FeaturesSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}