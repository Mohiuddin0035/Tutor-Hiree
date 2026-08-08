"use client";

import Link from "next/link";
import NavbarWrapper from "@/components/NavbarWrapper";

export default function ContactPage() {
  return (
    <div className="relative flex-grow w-full bg-slate-950 text-[var(--foreground)] overflow-hidden pb-16">
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
            Contact <img src="/logo.png" alt="TutorHire" className="h-24 sm:h-28 lg:h-32 w-auto dark:invert -mb-2 sm:-mb-3 -ml-1 sm:-ml-2" />
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Have questions, feedback, or need premium enterprise support? We are always here to assist you.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 flex flex-col justify-between text-center items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Email Us</h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-4">Drop us a line and we will reply as soon as possible.</p>
            <a href="mailto:support@tutorhire.com" className="text-xs sm:text-sm font-mono font-bold text-emerald-400 hover:text-emerald-300">
              support@tutorhire.com
            </a>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 flex flex-col justify-between text-center items-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Office Location</h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-4">Paikpara, Mirpur-1</p>
            <span className="text-xs sm:text-sm font-mono font-bold text-indigo-400">
              Bangladesh
            </span>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/30 flex flex-col justify-between text-center items-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Call Support</h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-4">Available 10:00 AM - 10:00 PM</p>
            <a href="tel:09696-847847" className="text-xs sm:text-sm font-mono font-bold text-amber-400 hover:text-amber-300">
              +8809696-847847
            </a>
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
