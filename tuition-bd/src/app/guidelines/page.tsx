"use client";

import Link from "next/link";
import NavbarWrapper from "@/components/NavbarWrapper";

export default function GuidelinesPage() {
  return (
    <div className="relative flex-grow w-full bg-slate-955 text-[var(--foreground)] overflow-hidden pb-16">
      {/* Premium Ambient Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(var(--theme-rgb),0.15) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px, 20px 20px, 20px 20px"
        }}
      />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <NavbarWrapper />

      <div className="relative z-10 max-w-4xl mx-auto px-4 mt-8 sm:mt-12">
        {/* Title */}
        <div className="text-center space-y-2 mb-8">
<h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--foreground)] mt-4 flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            <img src="/logo.png" alt="TutorHire" className="h-24 sm:h-28 lg:h-32 w-auto dark:invert -mb-2 sm:-mb-3 -mr-1 sm:-mr-2" /> Policies
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Please read our guidelines to understand safety operations, escrow procedures, and community rules.
          </p>
        </div>

        {/* Guidelines List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2.5" />
              1. Identity Verification
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              All tutors are required to upload national ID documentation and educational transcripts before matching with parents. These details remain strictly confidential and are only checked by verified staff.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2.5" />
              2. Escrow Protection
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              To guarantee seamless operations, parent and tutor contacts are revealed instantly upon matching.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2.5" />
              3. Privacy Policy
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Real-time live locations are strictly secured and never shared publicly. Location data is processed dynamically to matching boundaries and is never saved permanently.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2.5" />
              4. Refund Policy
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Tutors who pay the 10% connection commission fee are eligible for a full refund if the tuition match is unsuccessful or disputed. Refund requests must be submitted through the dashboard within 24 hours of payment. Our administrative team will review and approve valid requests, immediately reverting the connection.
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Link href="/">
            <button className="px-6 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-emerald-500/30 transition-all text-xs font-mono font-extrabold uppercase tracking-wider cursor-pointer">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
