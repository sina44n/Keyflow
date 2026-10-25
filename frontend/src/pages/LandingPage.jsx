import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { CurriculumPreview } from '../components/landing/CurriculumPreview';
import { ArcadePreview } from '../components/landing/ArcadePreview';
import { ThemesShowcase } from '../components/landing/ThemesShowcase';
import { TelemetryPreview } from '../components/landing/TelemetryPreview';
import { CTASection } from '../components/landing/CTASection';

export const LandingPage = () => {
  return (
    <main className="w-full">
      <HeroSection />
      <CurriculumPreview />
      <ArcadePreview />
      <ThemesShowcase />
      <TelemetryPreview />
      <CTASection />
    </main>
  );
};
