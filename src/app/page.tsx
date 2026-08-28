"use client";

import React from "react";
import HeroSection from "@/components/landing/hero-section";
import StatsBar from "@/components/landing/stats-bar";
import BentoFeatures from "@/components/landing/bento-features";
import SectorShowcase from "@/components/landing/sector-showcase";
import HardwareCompatibility from "@/components/landing/hardware-compatibility";
import PricingSection from "@/components/landing/pricing-section";
import TestimonialsSection from "@/components/landing/testimonials-section";
import FaqAccordion from "@/components/landing/faq-accordion";
import CtaBanner from "@/components/landing/cta-banner";
import LandingFooter from "@/components/landing/landing-footer";
import { LandingThemeProvider, useLandingTheme } from "@/components/landing/landing-theme-context";

function LandingContent() {
  const { isDark } = useLandingTheme();

  return (
    <div
      className={`flex-1 overflow-x-hidden scroll-smooth font-sans transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-slate-100 dark" : "bg-white text-slate-900"
      }`}
    >
      {/* 1. Hero Section with 0ms Offline Badge, Gradient Headline, CTAs, Theme Switcher & Interactive Touch POS Mockup */}
      <HeroSection />

      {/* 2. Key Metrics Bar (0ms Latency, +38% Recovery, 100% Offline, CDF & USD) */}
      <StatsBar />

      {/* 3. 21st.dev / Aceternity Styled Bento Grid (Offline Engine, WhatsApp Debt Recovery, Mobile Money & Multi-Store) */}
      <BentoFeatures />

      {/* 4. Sector Compatibility Showcase (Supermarkets, Resto-Bars, Hardware Stores, Fashion, Beverage Depots, Services) */}
      <SectorShowcase />

      {/* 5. Hardware Ecosystem Compatibility (Android/iOS, PC/Mac, Thermal Printers 58/80mm, Barcode Scanners) */}
      <HardwareCompatibility />

      {/* 6. Pricing Section (Bento Cards with Monthly/Annual Toggle and CDF/USD Live Converter) */}
      <PricingSection />

      {/* 7. Authentic B2B Merchant Testimonials across Africa */}
      <TestimonialsSection />

      {/* 8. Interactive FAQ Accordion with Search & Category Filtering */}
      <FaqAccordion />

      {/* 9. High-Impact Final CTA Banner with Direct WhatsApp Assistance (+243) */}
      <CtaBanner />

      {/* 10. Comprehensive Footer */}
      <LandingFooter />
    </div>
  );
}

export default function LandingPage() {
  return (
    <LandingThemeProvider>
      <LandingContent />
    </LandingThemeProvider>
  );
}
