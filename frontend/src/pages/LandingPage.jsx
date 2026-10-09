import React from 'react';
import HeroSection from '../components/landing/HeroSection';
import CreatorShowcase from '../components/landing/CreatorShowcase';
import LiveBriefsSection from '../components/landing/LiveBriefsSection';
import AiBriefPlayground from '../components/landing/AiBriefPlayground';
import VerificationDifferentiator from '../components/landing/VerificationDifferentiator';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import CtaBanner from '../components/landing/CtaBanner';

export default function LandingPage() {
  return (
    <div>
      {/* 1. Distinctive Editorial Hero */}
      <HeroSection />

      {/* 2. Real Verified Creator Discovery Showcase */}
      <CreatorShowcase />

      {/* 3. Live Campaign Briefs Feed */}
      <LiveBriefsSection />

      {/* 4. Interactive Live AI Brief Playground */}
      <AiBriefPlayground />

      {/* 5. Enterprise Verification & Provenance Advantage */}
      <VerificationDifferentiator />

      {/* 6. Dual-Track How It Works Breakdown */}
      <HowItWorksSection />

      {/* 7. Bottom Conversion Banner */}
      <CtaBanner />
    </div>
  );
}
