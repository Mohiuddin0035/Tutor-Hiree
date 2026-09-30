"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on interactive map and dashboard views for clean layout
  const isHiddenRoute = pathname?.startsWith("/dashboard") || 
                        pathname?.startsWith("/map") ||
                        pathname?.startsWith("/admin") ||
                        pathname?.startsWith("/login") ||
                        pathname?.startsWith("/register");

  if (isHiddenRoute) return null;

  return (
    <footer className="w-full bg-slate-950/80 border-t border-slate-900 mt-auto relative z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 sm:gap-12">
          {/* Logo / Tagline */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block group -ml-3 sm:-ml-4">
              <img src="/logo.png" alt="TutorHire Logo" className="h-24 sm:h-28 w-auto dark:invert" />
            </Link>
            <p className="text-xs sm:text-sm text-[var(--muted)] max-w-sm leading-relaxed -mt-6 sm:-mt-8">
              Connect with verified tutors and find tuition jobs in Bangladesh using our interactive map-based platform.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-extrabold">Discovery</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--muted)]">
              <li>
                <Link href="/map?type=tuition" className="hover:text-emerald-400 transition-colors">Find Tuition</Link>
              </li>
              <li>
                <Link href="/map?type=tutor" className="hover:text-emerald-400 transition-colors">Find Tutors</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-extrabold">Company</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--muted)]">
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link href="/guidelines" className="hover:text-emerald-400 transition-colors">Policy Guidelines</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-900 my-6 sm:my-8" />

        {/* Bengali Disclaimer & Bottom Info */}
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-900 shadow-inner max-w-4xl">
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
              <span className="text-emerald-400 font-bold">বি.দ্র.:</span> TutorHire সরাসরি কোনো টিউশন সেবা দেয় না; বরং এটি নিরাপদ প্রযুক্তির মাধ্যমে শিক্ষার্থী ও দক্ষ টিউটরদের যুক্ত করার একটি মাধ্যম মাত্র।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-[var(--muted)] font-mono">
            <p>&copy; {new Date().getFullYear()} TutorHire. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
