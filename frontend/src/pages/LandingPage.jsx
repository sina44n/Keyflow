/**
 * KEYFLOW Public Landing Page
 * ============================
 * Premium white/dark responsive landing page featuring:
 * - Dynamic Hero Section
 * - Daily Personalized/Public Quote Widget (12h rotation)
 * - Features Grid (Accuracy, Curriculum, Arcade, Audio, Isolation)
 * - Arcade Games Showcase
 * - How It Works 3-Step System
 * - Themes Showcase
 * - Telemetry Preview
 * - Strong Conversion Call to Action
 */

import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { ArcadePreview } from '../components/landing/ArcadePreview';
import { ThemesShowcase } from '../components/landing/ThemesShowcase';
import { TelemetryPreview } from '../components/landing/TelemetryPreview';
import { CTASection } from '../components/landing/CTASection';
import { QuoteCard } from '../components/common/QuoteCard';

export const LandingPage = () => {
  return (
    <main className="w-full">
      <HeroSection />

      {/* Daily Rotating Quote Banner */}
      <section className="py-12 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-elevated)_40%,var(--bg-main))]">
        <div className="container-app max-w-4xl mx-auto">
          <QuoteCard />
        </div>
      </section>

      <FeaturesSection />
      <ArcadePreview />
      <HowItWorksSection />
      <ThemesShowcase />
      <TelemetryPreview />
      <CTASection />
    </main>
  );
};
