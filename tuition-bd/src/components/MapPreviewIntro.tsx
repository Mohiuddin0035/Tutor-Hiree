"use client";
import { fetchApi } from "@/lib/api";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const OnboardingBackgroundMap = dynamic(
  () => import("@/components/map/OnboardingBackgroundMap"),
  { ssr: false }
);

interface MapPreviewIntroProps {
  onComplete: () => void;
}

type OnboardingStep = "scanning" | "posting" | "matching" | "connecting" | "success";

// Converts Bangladesh coordinates to exact flat SVG canvas dimensions (480x420)
const mapToSvgCoords = (lat: number, lng: number) => {
  const latMin = 23.68;
  const latMax = 23.86;
  const lngMin = 90.32;
  const lngMax = 90.46;

  const y = 420 - ((lat - latMin) / (latMax - latMin)) * 420;
  const x = ((lng - lngMin) / (lngMax - lngMin)) * 480;

  return { 
    x: Math.max(50, Math.min(x, 430)), 
    y: Math.max(50, Math.min(y, 370)) 
  };
};

export default function MapPreviewIntro({ onComplete }: MapPreviewIntroProps) {
  const [step, setStep] = useState<OnboardingStep>("scanning");
  const [liveJobs, setLiveJobs] = useState<any[]>([]);
  const [liveTutors, setLiveTutors] = useState<any[]>([]);
  const [matchedPair, setMatchedPair] = useState<{ job: any; tutor: any } | null>(null);

  // 1. Fetch Real-time Database Data
  useEffect(() => {
    async function fetchRealtimeMapData() {
      try {
        const [jobs, tutors] = await Promise.all([
          fetchApi("/jobs"),
          fetchApi("/users?role=TUTOR")
        ]);

        if (jobs && tutors) {

          const validJobs = Array.isArray(jobs) ? jobs.filter(j => j.approxLat && j.approxLng) : [];
          const validTutors = Array.isArray(tutors) ? tutors.filter(t => t.profile?.latitude && t.profile?.longitude) : [];

          setLiveJobs(validJobs.slice(0, 10));
          setLiveTutors(validTutors.slice(0, 10));

          if (validJobs.length > 0 && validTutors.length > 0) {
            const targetJob = validJobs[0];
            let bestTutor = validTutors[0];
            let minDistance = Infinity;

            const jobLat = targetJob.approxLat;
            const jobLng = targetJob.approxLng;

            validTutors.forEach((tutor) => {
              const tLat = tutor.profile.latitude;
              const tLng = tutor.profile.longitude;
              const dist = Math.pow(tLat - jobLat, 2) + Math.pow(tLng - jobLng, 2);
              if (dist < minDistance) {
                minDistance = dist;
                bestTutor = tutor;
              }
            });

            setMatchedPair({ job: targetJob, tutor: bestTutor });
          }
        }
      } catch (err) {
        console.warn("ONBOARDING_LIVE_DATA_FETCH_FAILED", err);
      }
    }

    fetchRealtimeMapData();
  }, []);

  // 2. Timeline Step Cycle: Progress step statuses naturally over 8.5 seconds
  useEffect(() => {
    const timer1 = setTimeout(() => setStep("posting"), 1600);
    const timer2 = setTimeout(() => setStep("matching"), 3400);
    const timer3 = setTimeout(() => setStep("connecting"), 5200);
    const timer4 = setTimeout(() => setStep("success"), 6800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // Stable visual percentage coordinates to guarantee 100% responsive sub-pixel scaling on any screen size!
  // Map dimensions are based on standard 480 x 420 viewBox canvas coordinates
  const guardianCoords = { x: 145, y: 230, left: "30.2%", top: "54.7%" };
  const mainTutorCoords = { x: 325, y: 155, left: "67.7%", top: "36.9%" };

  // Geometrical midpoint representing the central coordinating platform
  const midX = (guardianCoords.x + mainTutorCoords.x) / 2;
  const midY = (guardianCoords.y + mainTutorCoords.y) / 2 - 10;
  const midLeft = "48.9%";
  const midTop = "43.5%";

  // Metadata describing our 5-stage side timeline steps in easy English
  const stepsList = [
    { key: "scanning", title: "1. Finding Locations", desc: "Loading Bangladesh map sectors and live database." },
    { key: "posting", title: "2. Guardian Posts Job", desc: "A parent posts a new tuition request on the map." },
    { key: "matching", title: "3. Finding Tutors", desc: "Our platform searches for nearby verified tutors." },
    { key: "connecting", title: "4. Secure Connection", desc: "Securing trust and contact channels between both sides." },
    { key: "success", title: "5. Match Successful", desc: "Job is matched securely! Parent and Tutor are both happy." }
  ];

  const currentActiveStep = stepsList.find(s => s.key === step) || stepsList[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center overflow-y-auto px-4 py-6 font-sans">
      {/* Sci-Fi Blueprint Backdrop Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(var(--theme-rgb),0.15) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px, 20px 20px, 20px 20px"
        }}
      />

      {/* Main Title Banner - Compact on mobile */}
      <div className="relative z-20 text-center max-w-xl w-full px-2 space-y-1 md:space-y-2 mb-4 md:mb-6 flex-shrink-0">
        <h2 className="text-lg md:text-xl lg:text-2xl font-black text-white tracking-tight pt-1">
          How{" "}
          <span className="text-emerald-400">
            TutorHire
          </span>{" "}
          Works
        </h2>
        <p className="text-[10.5px] md:text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          Watch how parents and tutors connect safely all over Bangladesh through our secure platform.
        </p>
      </div>

      {/* Responsive Split Container (Layout adapts perfectly to small screens) */}
      <div className="relative z-20 flex flex-col lg:flex-row items-center justify-center gap-5 lg:gap-8 max-w-5xl w-full max-h-[85vh] lg:max-h-none">
        
        {/* DESKTOP VIEW ONLY: Full 5-stage side timeline stepper panel */}
        <div className="hidden lg:flex w-[320px] bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 flex-col justify-center space-y-5 shadow-2xl">
          <h3 className="text-xs font-mono font-black tracking-widest text-emerald-400 border-b border-slate-800 pb-3 uppercase flex items-center justify-between">
            <span>How it Works</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </h3>
          
          <div className="space-y-4">
            {stepsList.map((s, idx) => {
              const isActive = step === s.key;
              const isPast = stepsList.findIndex(x => x.key === step) > idx;
              
              return (
                <div 
                  key={s.key} 
                  className={`flex items-start space-x-3.5 transition-all duration-300 ${
                    isActive 
                      ? "opacity-100 scale-[1.02]" 
                      : isPast 
                      ? "opacity-60" 
                      : "opacity-25"
                  }`}
                >
                  {/* Status Circle Indicators */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isPast ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-400 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                        ✓
                      </div>
                    ) : isActive ? (
                      <div className="relative flex h-5 w-5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/35 opacity-75" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(var(--theme-rgb),0.8)]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                      </div>
                    )}
                  </div>

                  {/* Step Description details */}
                  <div className="text-left">
                    <h4 className={`text-[10px] font-mono tracking-widest font-extrabold uppercase leading-none ${
                      isActive ? "text-emerald-400" : isPast ? "text-slate-400" : "text-slate-500"
                    }`}>
                      {s.title}
                    </h4>
                    <p className={`text-[10.5px] font-medium leading-tight mt-1.5 ${
                      isActive ? "text-white" : isPast ? "text-slate-400" : "text-slate-600"
                    }`}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MOBILE VIEW ONLY: Super compact active step card below map with a premium 3D card flip transition */}
        <div className="flex lg:hidden w-full max-w-[340px] xs:max-w-[400px] sm:max-w-[480px] bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 shadow-xl flex-shrink-0 min-h-[76px] items-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d", perspective: 1000 }}
              className="flex items-start space-x-3.5 text-left w-full"
            >
              <div className="relative flex h-5 w-5 mt-0.5 flex-shrink-0 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/35 opacity-75" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(var(--theme-rgb),0.8)]" />
              </div>
              <div>
                <h4 className="text-[10px] font-mono tracking-widest font-black text-emerald-400 uppercase leading-none">
                  {currentActiveStep.title}
                </h4>
                <p className="text-[11px] text-white font-medium mt-1.5 leading-tight">
                  {currentActiveStep.desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Map Showcase Window (Completely fluid and percentage-scaled for 100% mobile alignment) */}
        <div className="relative w-full max-w-[340px] xs:max-w-[400px] sm:max-w-[480px] aspect-[480/420] rounded-3xl border border-slate-800 bg-slate-955 shadow-[0_15px_35px_rgba(0,0,0,0.85)] overflow-hidden flex items-center justify-center flex-shrink-0">
          
          {/* Real styled OpenStreetMap Background layer */}
          <OnboardingBackgroundMap />

          {/* Glow indicators */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />

          {/* Sonar sweep only in scanning phase */}
          {step === "scanning" && (
            <>
              <motion.div
                animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-24 h-24 border border-emerald-400/40 rounded-full z-20 pointer-events-none"
              />
              <motion.div
                animate={{ y: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-0.5 bg-emerald-500/20 pointer-events-none"
              />
            </>
          )}

          {/* 1. RENDER ACTIVE GUARDIANS ON THE GRID (Locked perfectly in percentage space) */}
          {step !== "scanning" && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ left: guardianCoords.left, top: guardianCoords.top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center"
            >
              {/* Active Sonar Ring */}
              <span className="absolute flex h-14 w-14 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500/15 opacity-75" />
                <span className="animate-pulse absolute inline-flex h-10 w-10 rounded-full bg-indigo-500/10" />
              </span>

              {/* Guardian Profile Avatar Card */}
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900 border-2 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                {step === "success" ? (
                  // Happy Smiley parent
                  <span className="text-lg sm:text-xl">😄</span>
                ) : (
                  // Home/Parent Icon
                  <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
              </div>
              
              <div className="mt-1 sm:mt-1.5 text-[7px] sm:text-[8px] font-black font-mono tracking-wider text-indigo-300 bg-slate-950/95 border border-indigo-500/30 px-1.5 py-0.5 sm:px-2 rounded shadow uppercase">
                Guardian
              </div>

              {/* Parent Speech bubble on success */}
              {step === "success" && (
                <motion.div
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  className="absolute -top-8 sm:-top-10 -translate-x-10 sm:-translate-x-12 bg-indigo-950/95 border border-indigo-500/40 text-[6.5px] sm:text-[7px] text-indigo-300 font-extrabold uppercase tracking-widest px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg shadow-lg whitespace-nowrap z-40"
                >
                  🎓 Perfect Tutor Match!
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 2. RENDER ACTIVE TUTORS ON THE GRID */}
          {(step === "matching" || step === "connecting" || step === "success") && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ left: mainTutorCoords.left, top: mainTutorCoords.top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center"
            >
              {/* Active matching pulse */}
              <span className="absolute flex h-14 w-14 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/15 opacity-75" />
              </span>

              {/* Tutor Profile Avatar Card */}
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-[0_0_15px_rgba(var(--theme-rgb),0.4)]">
                {step === "success" ? (
                  // Happy Smiley tutor
                  <span className="text-lg sm:text-xl">🤗</span>
                ) : (
                  // Graduation Cap
                  <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-emerald-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                )}
              </div>
              
              <div className="mt-1 sm:mt-1.5 text-[7px] sm:text-[8px] font-black font-mono tracking-wider text-emerald-300 bg-slate-950/95 border border-emerald-500/30 px-1.5 py-0.5 sm:px-2 rounded shadow uppercase">
                Verified Tutor
              </div>

              {/* Tutor Speech bubble on success */}
              {step === "success" && (
                <motion.div
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  className="absolute -top-8 sm:-top-10 bg-emerald-950/95 border border-emerald-500/40 text-[6.5px] sm:text-[7px] text-emerald-300 font-extrabold uppercase tracking-widest px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg shadow-lg whitespace-nowrap z-40"
                >
                  Alhamdulillah! 🎓
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 3. TUITION CONSOLE MIDDLEMAN NODE */}
          {(step === "connecting" || step === "success") && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ left: midLeft, top: midTop }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-none"
            >
              <span className="absolute flex h-14 w-14 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14b8a6]/20 opacity-75" />
                <span className="animate-pulse absolute inline-flex h-10 w-10 rounded-full bg-emerald-500/10" />
              </span>

              {/* Custom 'T' Logo Badge */}
              <div className="relative flex items-center justify-center rounded-full h-8 w-8 sm:h-10 sm:w-10 bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] z-10">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none">
                  {/* Top Bar */}
                  <rect x="2" y="3" width="20" height="5" className="fill-black dark:fill-white" />
                  {/* Vertical Stem with Angled Cut */}
                  <polygon points="9,13 15,8.5 15,22 9,22" className="fill-[#334155] dark:fill-[#cbd5e1]" />
                </svg>
              </div>
              
              <div className="mt-1.5 text-[8.5px] sm:text-[10px] font-black font-sans tracking-tight bg-slate-950/90 border border-slate-800/80 px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg">
                <span className="text-emerald-400">
                  TutorHire
                </span>
              </div>
            </motion.div>
          )}

          {/* 4. REAL-TIME CURVED COORDINATES MATCHING DASHES (Uses SVG scale viewBox for fluid responsive alignment!) */}
          {(step === "connecting" || step === "success") && (
            <svg viewBox="0 0 480 420" className="absolute inset-0 w-full h-full z-20 pointer-events-none">
              {/* Guardian -> Middleman */}
              <motion.path
                d={`M ${guardianCoords.x} ${guardianCoords.y} Q ${(guardianCoords.x + midX)/2} ${(guardianCoords.y + midY)/2 - 20} ${midX} ${midY}`}
                stroke="#818cf8"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="6 4"
                animate={{ strokeDashoffset: [-100, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              {/* Middleman -> Tutor */}
              <motion.path
                d={`M ${midX} ${midY} Q ${(midX + mainTutorCoords.x)/2} ${(midY + mainTutorCoords.y)/2 - 20} ${mainTutorCoords.x} ${mainTutorCoords.y}`}
                stroke="#34d399"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="6 4"
                animate={{ strokeDashoffset: [-100, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />

              {/* Glowing match bullets */}
              <motion.circle
                r="4.5"
                fill="#818cf8"
                animate={{ cx: [guardianCoords.x, midX], cy: [guardianCoords.y, midY], opacity: [1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
              <motion.circle
                r="4.5"
                fill="#34d399"
                animate={{ cx: [midX, mainTutorCoords.x], cy: [midY, mainTutorCoords.y], opacity: [1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          )}

          {/* 5. RENDER NEIGHBORHOOD MAP MARKER DETAILS */}
          {liveJobs.slice(1).map((job, idx) => {
            const coords = mapToSvgCoords(job.approxLat, job.approxLng);
            const leftPct = `${(coords.x / 480) * 100}%`;
            const topPct = `${(coords.y / 420) * 100}%`;
            return (
              <div
                key={`job-${idx}`}
                style={{ left: leftPct, top: topPct }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40 z-20"
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-900 border border-indigo-500/40 flex items-center justify-center">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-indigo-400" />
                </div>
              </div>
            );
          })}

          {liveTutors.filter(t => t.id !== matchedPair?.tutor?.id).map((tutor, idx) => {
            const coords = mapToSvgCoords(tutor.profile.latitude, tutor.profile.longitude);
            const leftPct = `${(coords.x / 480) * 100}%`;
            const topPct = `${(coords.y / 420) * 100}%`;
            return (
              <div
                key={`tutor-${idx}`}
                style={{ left: leftPct, top: topPct }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40 z-20"
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-900 border border-emerald-500/40 flex items-center justify-center">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>
            );
          })}

          {/* Success Popup Escrow Validation Card */}
          <AnimatePresence>
            {step === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-3 sm:bottom-6 inset-x-3 sm:inset-x-4 z-40 glass-panel p-3 sm:p-4 rounded-2xl border border-[#14b8a6]/30 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 text-left">
                  <div className="flex items-center justify-center flex-shrink-0 mr-3 sm:mr-4">
                    <img src="/logo.png" alt="TutorHire" className="h-10 sm:h-12 w-auto object-contain dark:invert" />
                  </div>
                  <div className="max-w-[170px] xs:max-w-[220px] sm:max-w-[280px]">
                    <h4 className="text-[8.5px] sm:text-[9.5px] font-mono font-black text-amber-400 uppercase tracking-widest leading-none">
                      BANGLADESH'S 1ST LIVE MATCH
                    </h4>
                    <p className="text-[10px] sm:text-[11.5px] text-white font-extrabold mt-1 leading-tight">
                      Real-Time Location Matched!
                    </p>
                    <p className="text-[8.5px] sm:text-[9.5px] text-slate-300 mt-1 leading-snug font-semibold">
                      TutorHire is the first platform in Bangladesh to match tutors using live location.
                    </p>
                  </div>
                </div>

                {/* Enter portal trigger */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onComplete}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-[8.5px] sm:text-[9px] font-mono font-black uppercase tracking-wider transition-colors cursor-pointer border-none shadow-[0_4px_12px_rgba(245,158,11,0.3)] ml-2 flex-shrink-0"
                >
                  Enter
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Skip Button - Positioned cleanly relative to container to avoid overlapping elements */}
      <button 
        onClick={onComplete}
        className="mt-6 text-[9px] md:text-[10px] tracking-widest text-slate-500 hover:text-emerald-400 border border-slate-800/80 hover:border-emerald-500/20 bg-slate-955 px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-bold uppercase shadow animate-pulse flex-shrink-0"
      >
        Skip Intro
      </button>
    </div>
  );
}
