"use client";

import { useState, useEffect } from "react";
import NavbarWrapper from "@/components/NavbarWrapper";
import Hero from "@/components/Hero";
import TuitionEstimator from "@/components/TuitionEstimator";
import RoleDashboardSectors from "@/components/RoleDashboardSectors";
import MapPreviewIntro from "@/components/MapPreviewIntro";

export default function Home() {
  const [showIntro, setShowIntro] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 flex flex-col relative">
      <NavbarWrapper />
      
      <Hero 
        onTriggerDemo={() => setShowIntro(true)}
      />

      <RoleDashboardSectors />
      
      <TuitionEstimator />

      {/* Animated Satellite Map Preview Onboarding Intro Overlay */}
      {showIntro && (
        <MapPreviewIntro onComplete={() => setShowIntro(false)} />
      )}
    </div>
  );
}

