"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FrontPageAdditionsProps {
  selectedRole: "parent" | "tutor";
}

export default function FrontPageAdditions({ selectedRole }: FrontPageAdditionsProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Content databases based on role
  const stats = selectedRole === "parent" ? [
    { value: "12,400+", label: "Verified Tutors", description: "Top universities & background checked" },
    { value: "4.92/5.0", label: "Parent Rating", description: "Voted by thousands of satisfied families" },
    { value: "Nationwide", label: "Dense Coverage", description: "Connecting users across Bangladesh" },
    { value: "15 Mins", label: "Avg. Match Time", description: "Get connected to expert teachers instantly" },
  ] : [
    { value: "BDT 22k+", label: "Top Monthly Salary", description: "Premium rates for elite academic coaches" },
    { value: "4,800+", label: "Active Jobs", description: "New tuition requests posted daily" },
    { value: "100%", label: "Parent Verified", description: "Secure phone & location confirmations" },
    { value: "Instant", label: "Instant Connection", description: "Unlock parent contact info after match" },
  ];

  const steps = selectedRole === "parent" ? [
    {
      num: "01",
      title: "Browse Local Map",
      desc: "Use our interactive Leaflet OSM map to locate certified teachers in your immediate sector, filtering by subjects and class boards.",
      textColor: "text-emerald-400",
      glow: "rgba(239,68,68,0.15)"
    },
    {
      num: "02",
      title: "Verify Credentials",
      desc: "Review selected tutor portfolios, official NID/University validation statuses, student feedback ratings, and past tuition experience histories.",
      textColor: "text-indigo-400",
      glow: "rgba(244,63,94,0.15)"
    },
    {
      num: "03",
      title: "Start Learning Classes",
      desc: "Schedule demo lessons, conduct screening interviews, and launch your student's optimized academic learning journey with absolute peace of mind.",
      textColor: "text-emerald-400",
      glow: "rgba(239,68,68,0.15)"
    }
  ] : [
    {
      num: "01",
      title: "Upload Verification",
      desc: "Upload university IDs or academic certificates to receive the green verification badge and build instant trust with parents.",
      textColor: "text-indigo-400",
      glow: "rgba(244,63,94,0.15)"
    },
    {
      num: "02",
      title: "Locate Hotspots",
      desc: "Browse our active tuition job map for pin-drop requests within your radius, complete with target budgets and scheduling notes.",
      textColor: "text-emerald-400",
      glow: "rgba(239,68,68,0.15)"
    },
    {
      num: "03",
      title: "Instant Connection",
      desc: "Lock in the job, unlock parent verified telephone contact numbers with a small 10% commission, and begin professional classes.",
      textColor: "text-indigo-400",
      glow: "rgba(244,63,94,0.15)"
    }
  ];

  const faqs = selectedRole === "parent" ? [
    {
      q: "How does TutorHire verify registered tutors?",
      a: "Safety and academic excellence are our foundations. Tutors must upload valid university identification cards (e.g. BUET, DU, NSU, BRAC) and national identity cards (NID). Our administrators manually inspect each document before awarding the official green verification badge."
    },
    {
      q: "Is my exact apartment address displayed to tutors?",
      a: "Absolutely not. To ensure maximum family security and personal privacy, tutor dashboards display only approximate circular sector zones (e.g. Mirpur-12 Block C area) instead of specific street addresses. Exact details are only shared directly when you choose to connect."
    },
    {
      q: "Are there any hidden costs to post a tuition job?",
      a: "None. Parents can browse tutor portfolios, filter categories, post infinite tuition requirements, and interview candidates completely free of charge. Tutors handle a small 10% connection fee."
    },
    {
      q: "How do I connect with a matched tutor?",
      a: "Simply browse active tutor pins, review credentials, and submit a connection shortlist request. Once the tutor accepts, direct communication lines are instantly unlocked."
    }
  ] : [
    {
      q: "How do I secure the verified tutor badge?",
      a: "Navigate to your Dashboard portal, complete all background fields, and upload clear scans of your Student ID card and National ID (NID). Verified tutors receive up to 6x more interview requests from premium parents!"
    },
    {
      q: "What is the fee to unlock parent contact numbers?",
      a: "Applying for tuition posts on the live OSM map is completely free. Once a parent reviews and shortlist-approves your application, a minor 10% commission fee (based on the salary) is settled securely to reveal the direct calling hotline."
    },
    {
      q: "How long does verification approval take?",
      a: "Our institutional auditing team is active daily from 9 AM to 11 PM. Verification credentials are typically audited, approved, and badges launched active within 1 to 3 hours from upload."
    },
    {
      q: "Can I filter jobs by specific university requirements?",
      a: "Yes! Tutors can filter active map pins by subject tags, class curriculum boards (English Version, Bangla Medium, Edexcel/Cambridge), target budgets, and specific geographic sub-districts."
    }
  ];

  return (
    <div className="space-y-16 pb-4">
      {/* 1. Timeline Section: How it Works */}
      <section className="relative">
        {/* Decorative backdrop gradients */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[250px] h-[250px] bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-indigo-500/5 rounded-full filter blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-mono tracking-widest text-emerald-400 uppercase font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit mx-auto">
              Simple Workflow
            </h2>
            <p className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-[var(--foreground)] leading-tight">
              {selectedRole === "parent" ? "Find the Perfect Tutor in 3 Steps" : "Start Earning as a Premium Tutor"}
            </p>
            <p className="text-sm sm:text-base text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              Designed specifically for the Bangladesh student community, here is how our secure connection portal works.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="glass-card rounded-2xl p-8 relative overflow-hidden group border border-slate-800/80 hover:border-emerald-500/20 transition-all duration-300"
              >
                {/* Visual back glow effect */}
                <div 
                  className="absolute -right-16 -top-16 w-32 h-32 rounded-full filter blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                  style={{ backgroundColor: step.glow }}
                />

                <div className="flex items-start justify-between mb-6">
                  <span className={`text-4xl font-extrabold ${step.textColor} font-mono tracking-tighter`}>
                    {step.num}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800/50 flex items-center justify-center text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-extrabold text-[var(--foreground)] font-heading">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Trust Statistics Section */}
      <section className="py-16 bg-slate-950/40 border-y border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center space-y-2">
                <span className="block text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-emerald-400">
                  {stat.value}
                </span>
                <span className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
                  {stat.label}
                </span>
                <span className="block text-[11px] sm:text-xs text-[var(--muted)] leading-relaxed font-sans">
                  {stat.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Dynamic Accordion FAQs Section */}
      <section className="relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-xs font-mono tracking-widest text-emerald-400 uppercase font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit mx-auto">
              Got Questions?
            </h2>
            <p className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[var(--foreground)]">
              Frequently Asked Questions
            </p>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              Clear answers to help you navigate our secure localized matching ecosystem.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-900 bg-slate-900/10 hover:border-slate-800 transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer"
                  >
                    <span className="text-sm font-extrabold text-[var(--foreground)] font-mono hover:text-emerald-400 transition-colors">
                      {faq.q}
                    </span>
                    <span className={`ml-4 text-slate-500 shrink-0 transform transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-400" : ""}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-sans border-t border-slate-950/40">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
