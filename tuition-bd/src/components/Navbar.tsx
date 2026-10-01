"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface NavbarProps {
  selectedRole?: "parent" | "tutor";
}

export default function Navbar({ selectedRole }: NavbarProps = {}) {
  const { data: session } = useSession() || { data: null };
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const currentType = searchParams ? searchParams.get("type") : (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("type") : null);

  const isLinkActive = (href: string) => {
    if (href.includes("?")) {
      const [path, query] = href.split("?");
      if (pathname !== path) return false;
      
      const searchParamsObj = new URLSearchParams(query);
      for (const [key, value] of searchParamsObj.entries()) {
        if (currentType !== value) return false;
      }
      return true;
    }
    
    if (href === "/map") {
      return pathname === "/map" && !currentType;
    }
    
    return pathname === href;
  };

  const getDashboardUrl = () => {
    if ((session?.user as any)?.role === "ADMIN") return "/admin";
    if ((session?.user as any)?.role === "TUTOR") return "/tutor";
    if ((session?.user as any)?.role === "PARENT") return "/parent";
    return "/dashboard";
  };

  useEffect(() => {
    setMounted(true);
    const isLightActive = document.documentElement.classList.contains("light");
    setTheme(isLightActive ? "light" : "dark");
  }, []);

  // Auto-close mobile menu on route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("light");
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 transition-all duration-300 w-full shadow-md border-b border-slate-200 dark:border-slate-800/40">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center">
            <div className="relative flex items-center">
              {pathname !== "/" && (
                <motion.button
                  whileHover={{ scale: 1.05, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/")}
                  className="absolute right-[100%] mr-1 sm:mr-2 p-1.5 sm:p-2 rounded-xl border border-slate-800/60 bg-slate-900/60 hover:border-emerald-500/40 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center group shrink-0"
                  title="Go to Homepage"
                >
                  <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
              )}
            
              <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center cursor-pointer"
              >
                {/* TutorHire Brand Logo */}
                <div className="flex items-center ml-1 -ml-2 sm:-ml-4">
                  <img src="/logo.png" alt="TutorHire Logo" className="h-16 sm:h-20 w-auto dark:invert mt-1 sm:mt-2" />
                </div>
              </motion.div>
            </Link>
            </div>

            {/* Main Navigation Links (Desktop) */}
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link
                href="/map?type=tuition"
                className={`relative inline-flex items-center px-1 pt-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 group ${
                  isLinkActive("/map?type=tuition")
                    ? "text-emerald-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <svg className="w-3.5 h-3.5 mr-1.5 text-emerald-500/80 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Find Tuition
                
              </Link>

              <Link
                href="/map?type=tutor"
                className={`relative inline-flex items-center px-1 pt-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 group ${
                  isLinkActive("/map?type=tutor")
                    ? "text-emerald-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <svg className="w-3.5 h-3.5 mr-1.5 text-emerald-500/80 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Find Tutors
                
              </Link>

              <Link
                href="/about"
                className={`relative inline-flex items-center px-1 pt-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 group ${
                  isLinkActive("/about")
                    ? "text-emerald-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                About Us
                
              </Link>

              <Link
                href="/contact"
                className={`relative inline-flex items-center px-1 pt-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 group ${
                  isLinkActive("/contact")
                    ? "text-emerald-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Contact Us
                
              </Link>

              <Link
                href="/guidelines"
                className={`relative inline-flex items-center px-1 pt-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 group ${
                  isLinkActive("/guidelines")
                    ? "text-emerald-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Policy Guidelines
                
              </Link>
            </div>
        </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-4">

            {/* Theme Toggle Button (Always Visible) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors duration-200 cursor-pointer shadow-inner flex items-center justify-center"
              aria-label="Toggle theme color mode"
            >
              {!mounted ? (
                <div className="w-4 h-4 animate-pulse rounded-full bg-slate-800" />
              ) : theme === "light" ? (
                <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              )}
            </motion.button>

            {/* Session Controls (Desktop-Only) */}
            {session ? (
              <div className="hidden sm:flex items-center space-x-4">
                <Link
                  href={getDashboardUrl()}
                  className={`text-xs font-mono uppercase tracking-wider font-extrabold px-4 py-2 rounded-xl border transition-all duration-200 ${
                    isLinkActive(getDashboardUrl())
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(var(--theme-rgb),0.15)]"
                      : "text-slate-400 hover:text-slate-200 bg-slate-900/30 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  Dashboard
                </Link>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => signOut()}
                  className="bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-extrabold transition-all duration-200 cursor-pointer"
                >
                  Sign Out
                </motion.button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-xs font-mono uppercase tracking-wider font-extrabold px-3.5 py-2 text-slate-400 hover:text-slate-200 transition-colors duration-200 cursor-pointer"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="bg-emerald-500 text-white font-sans font-black tracking-wider uppercase px-4 py-2 rounded-xl text-xs hover:brightness-110 shadow-[0_4px_12px_rgba(99,102,241,0.15)] transition-all cursor-pointer border-none"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburg Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900/40 sm:hidden text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors duration-200 cursor-pointer"
              aria-label="Toggle mobile navigation menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="sm:hidden border-t bg-slate-950/95 border-slate-900 backdrop-blur-xl overflow-hidden shadow-2xl relative z-40 rounded-b-2xl"
          >
            <div className="px-3.5 py-4.5 space-y-3.5 flex flex-col">
              {/* Navigation Links Grid (Exactly 2 Lines) */}
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/map?type=tuition"
                  className={`px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-extrabold transition-all duration-200 flex items-center ${
                    isLinkActive("/map?type=tuition")
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-slate-900/60"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 text-emerald-500/80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Find Jobs
                </Link>
                <Link
                  href="/map?type=tutor"
                  className={`px-3 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-extrabold transition-all duration-200 flex items-center ${
                    isLinkActive("/map?type=tutor")
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-slate-900/60"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 text-emerald-500/80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Find Tutors
                </Link>
                <Link
                  href="/about"
                  className={`px-3 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-wider font-bold transition-all duration-200 flex items-center ${
                    isLinkActive("/about")
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-slate-900/60"
                  }`}
                >
                  <svg className="w-3.5 h-3.5 mr-2 text-emerald-500/80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About Us
                </Link>
                <Link
                  href="/contact"
                  className={`px-3 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-wider font-bold transition-all duration-200 flex items-center ${
                    isLinkActive("/contact")
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-slate-900/60"
                  }`}
                >
                  <svg className="w-3.5 h-3.5 mr-2 text-emerald-500/80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Us
                </Link>
                <Link
                  href="/guidelines"
                  className={`px-3 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-wider font-bold transition-all duration-200 flex items-center ${
                    isLinkActive("/guidelines")
                      ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-slate-900/60"
                  }`}
                >
                  <svg className="w-3.5 h-3.5 mr-2 text-emerald-500/80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Guidelines
                </Link>
              </div>

              {/* Separator */}
              <div className="h-px w-full bg-slate-900/80" />

              {/* Session Controls (Mobile) */}
              {session ? (
                <div className="space-y-3 pt-2">
                  <Link
                    href={getDashboardUrl()}
                    className={`w-full px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-wider font-extrabold transition-all duration-200 flex items-center ${
                      isLinkActive(getDashboardUrl())
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <svg className="w-4 h-4 mr-3 text-emerald-500/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="w-full bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/20 py-3 rounded-xl text-xs font-mono uppercase tracking-wider font-extrabold transition-all duration-200 flex items-center justify-center cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Link href="/login" className="w-full">
                    <button
                      className="w-full py-3 rounded-xl text-xs font-mono uppercase tracking-wider font-extrabold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
                    >
                      Log in
                    </button>
                  </Link>
                  <Link href="/register" className="w-full">
                    <button className="w-full bg-emerald-500 text-white font-mono uppercase tracking-wider font-extrabold py-3 rounded-xl text-xs transition-all duration-200 flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.15)] border-none">
                      Sign up
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
