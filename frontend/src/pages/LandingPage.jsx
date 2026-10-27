import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { ArcadePreview } from '../components/landing/ArcadePreview';
import { ThemesShowcase } from '../components/landing/ThemesShowcase';
import { TelemetryPreview } from '../components/landing/TelemetryPreview';
import { CTASection } from '../components/landing/CTASection';

export const LandingPage = () => {
  return (
    <main className="w-full">
      <HeroSection />
      <ArcadePreview />
      <ThemesShowcase />
      <TelemetryPreview />
      <CTASection />
    </main>
  );
};
