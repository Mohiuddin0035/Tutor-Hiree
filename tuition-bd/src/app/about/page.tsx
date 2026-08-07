"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import NavbarWrapper from "@/components/NavbarWrapper";
import FrontPageAdditions from "@/components/FrontPageAdditions";

export default function AboutPage() {
  const [activeRole, setActiveRole] = useState<"parent" | "tutor">("parent");

  return (
    <div className="relative flex-grow w-full bg-slate-950 text-[var(--foreground)] overflow-hidden pb-24">
      {/* Premium Ambient Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(99,102,241,0.1) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px, 20px 20px, 20px 20px"
        }}
      />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <NavbarWrapper />

      <div className="relative z-10 max-w-7xl mx-auto px-4 mt-8 sm:mt-12">
        {/* Page Header */}
        <div className="text-center space-y-2 mb-8">
<h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--foreground)] mt-4 flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            About <img src="/logo.png" alt="TutorHire" className="h-24 sm:h-28 lg:h-32 w-auto dark:invert -mb-2 sm:-mb-3 -ml-1 sm:-ml-2" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed font-sans">
            TutorHire is the first platform in Bangladesh designed to match parents and tutors securely using state-of-the-art real-time live location.
          </p>
        </div>

        {/* Interactive neon sliding toggle selector */}
        <div className="flex justify-center mb-8">
          <div className="relative bg-slate-900/80 border border-slate-800 p-1 rounded-2xl flex max-w-sm w-full shadow-2xl backdrop-blur-xl">
            <button
              onClick={() => setActiveRole("parent")}
              className={`flex-1 py-3 text-xs font-mono font-extrabold uppercase tracking-wider rounded-xl transition-all duration-300 relative z-10 cursor-pointer ${
                activeRole === "parent" ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              For Parents
              {activeRole === "parent" && (
                <motion.div
                  layoutId="activeRoleTab"
                  className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/30 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.15)] -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveRole("tutor")}
              className={`flex-1 py-3 text-xs font-mono font-extrabold uppercase tracking-wider rounded-xl transition-all duration-300 relative z-10 cursor-pointer ${
                activeRole === "tutor" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              For Tutors
              {activeRole === "tutor" && (
                <motion.div
                  layoutId="activeRoleTab"
                  className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/30 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.15)] -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Core Engine Features Section */}
        <section className="py-6 border-t border-slate-900 relative mb-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
            <p className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[var(--foreground)] leading-tight">
              {activeRole === "tutor" ? "A better, more secure way to teach & earn" : "A better, more secure way to learn"}
            </p>
            <p className="text-xs sm:text-sm text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
              {activeRole === "tutor"
                ? "Unlock premium teaching vacancies, coordinate class schedules instantly, and protect your tutoring career with verified credentials and secure payouts."
                : "TutorHire introduces features tailored specifically for the Bangladesh tutoring ecosystem, maximizing transparency and trust."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Feature 1: Map-Based Discovery */}
            <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 flex gap-6">
              <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[var(--foreground)] font-heading">Map-Based Discovery</h3>
                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-sans">
                  {activeRole === "parent"
                    ? "Locate certified nearby tutors matching your class and subject requirements on our responsive interactive map, protecting exact locations until matching is complete."
                    : "Browse open tuition vacancies within your walking radius on the interactive job map, complete with target budgets and student scheduling details."}
                </p>
              </div>
            </div>

            {/* Feature 2: Verification Badges */}
            <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 flex gap-6">
              <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[var(--foreground)] font-heading">
                  {activeRole === "parent" ? "Verified Profiles" : "Profile Badges"}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-sans">
                  {activeRole === "parent"
                    ? "Security and credibility are our highest priorities. Tutors must upload official validation documents (NID or University IDs) to receive active verified credentials."
                    : "Gain immediate parent trust. Upload your university registration card and NID scan to secure the green verified profile badge, boosting application visibility by 6x."}
                </p>
              </div>
            </div>

            {/* Feature 3: Dynamic Operations */}
            <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 flex gap-6">
              <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                {activeRole === "parent" ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.571V9a4 4 0 00-4-4H4m15.542 7.5c1.127 1.95 1.766 4.212 1.766 6.622 0 1.221-.167 2.403-.48 3.528M17 11.571L17 9a4 4 0 00-4-4h-2m4 4.5V14a5 5 0 01-5 5H10" />
                  </svg>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[var(--foreground)] font-heading">
                  {activeRole === "parent" ? "Smart Scheduling" : "Instant Matching"}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-sans">
                  {activeRole === "parent"
                    ? "Coordinate weekly tutoring calendars, syllabus schedules, and class time duration preferences directly with active matches inside your unified home dashboard."
                    : "Experience seamless local integration. Unlock exact parent contact phone directories securely upon paying a small commission after a match."}
                </p>
              </div>
            </div>

            {/* Feature 4: Reviews & Ratings */}
            <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 bg-slate-900/30 flex gap-6">
              <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.252.583 1.882l-3.978 2.89a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.978-2.89a1 1 0 00-1.176 0l-3.978 2.89c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.978-2.89c-.77-.63-.372-1.882.583-1.882h4.908a1 1 0 00.95-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[var(--foreground)] font-heading">Reviews & Ratings</h3>
                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-sans">
                  {activeRole === "parent"
                    ? "Read authentic reviews and five-star quality ratings left by other local families to hire the most trusted and capable tutors for your children."
                    : "Receive honest feedback and five-star quality ratings from parents and students, establishing a strong academic reputation to land premium vacancies."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Safety Framework Section */}
        <section className="py-16 border-t border-slate-900 relative mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
            {/* Left side text */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[10px] tracking-[0.2em] font-mono font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full">
                Trust & Safety
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[var(--foreground)] leading-tight">
                Privacy First: <br />
                <span className="text-emerald-400">
                  How We Protect Matches
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                TutorHire was designed with user security as our top priority. We implement privacy-first features tailored specifically for the tutoring ecosystem in Bangladesh, ensuring peace of mind for both parents and educators.
              </p>
              <div className="space-y-4 text-xs">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--foreground)] font-sans">Approximate Map Locations</h4>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">Exact household coordinates are strictly masked. The live search map displays randomized approximate boundaries to protect student privacy.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--foreground)] font-sans">Institutional Credentials Verification</h4>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">Tutors must submit verified university registrations or National ID cards before being permitted to apply for active positions.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--foreground)] font-sans">Protected Contact Pipelines</h4>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">Direct phone numbers are hidden behind a secure matched verification, preventing spam calls and scraping bots.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side Secure Card Component */}
            <div className="lg:col-span-6 w-full">
              <div className="relative glass-card rounded-2xl border border-slate-800/80 p-6 bg-slate-900/20 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2.5">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">Verification Shield</span>
                  </div>
                  <span className="text-[10px] font-mono font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                    Audit Passed
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-450 text-lg font-bold">
                    FR
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-extrabold text-[var(--foreground)] font-sans">Fahim Rahman</h4>
                      <span className="flex h-4 w-4 bg-emerald-500/10 border border-emerald-500/35 rounded-full items-center justify-center text-emerald-400 text-[8px] font-bold">✓</span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">B.Sc. in CSE, BUET</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950/40 border border-slate-900 p-3.5 rounded-xl space-y-1">
                    <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">NID verification</span>
                    <span className="font-extrabold text-emerald-400 flex items-center space-x-1 font-sans text-xs">
                      <span>✓ Document Verified</span>
                    </span>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-900 p-3.5 rounded-xl space-y-1">
                    <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">Student ID Scan</span>
                    <span className="font-extrabold text-emerald-400 flex items-center space-x-1 font-sans text-xs">
                      <span>✓ BUET Checked</span>
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-mono">
                    <span>Protected Location Coordinates</span>
                    <span className="text-emerald-400 font-extrabold">Masked</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Exact Latitude:</span>
                      <span className="text-slate-500">23.82xxxx N (Encrypted)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Exact Longitude:</span>
                      <span className="text-slate-500">90.36xxxx E (Encrypted)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Timeline, Trust Stats, and FAQs */}
        <FrontPageAdditions selectedRole={activeRole} />

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

