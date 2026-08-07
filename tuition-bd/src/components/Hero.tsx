"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { DEFAULT_TUTORS, DEFAULT_JOBS } from "@/constants/mockData";

interface HeroProps {
  onTriggerDemo?: () => void;
}

export default function Hero({ onTriggerDemo }: HeroProps) {
  const words = useMemo(() => {
    return ["tutor near you", "tuition match", "home educator", "academic guide"];
  }, []);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);
  const [isMobile, setIsMobile] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const [mockIndex, setMockIndex] = useState(0);

  const [tutors, setTutors] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [tutorsRes, jobsRes] = await Promise.all([
          fetch("/api/users?role=TUTOR"),
          fetch("/api/jobs")
        ]);
        if (tutorsRes.ok && jobsRes.ok) {
          const tutorsData = await tutorsRes.json();
          const jobsData = await jobsRes.json();

          if (tutorsData && tutorsData.length > 0) {
            const mappedTutors = tutorsData.map((t: any, index: number) => {
              const p = t.profile || {};
              const defaultNames = ["Fahim Rahman", "Naimur Sohan", "Farhana Amin", "Tahmid Islam", "Aisha Siddiqua", "Sajid Hasan"];
              const realName = t.name && t.name !== "undefined" ? t.name : (defaultNames[index % defaultNames.length]);
              return {
                name: realName,
                specs: p.education || "Undergraduate Student",
                expertise: p.bio || "Mathematics & Sciences",
                sector: p.address || "Bangladesh",
                coords: `${p.approxLatitude?.toFixed(4) ?? (23.7 + Math.random() * 0.1).toFixed(4)}° N, ${p.approxLongitude?.toFixed(4) ?? (90.3 + Math.random() * 0.1).toFixed(4)}° E`
              };
            });
            setTutors(mappedTutors);
          }

          if (jobsData && jobsData.length > 0) {
            const mappedJobs = jobsData.map((j: any) => {
              const rawTitle = j.title || "Tuition Job";
              const cleanTitle = rawTitle.length > 26 ? rawTitle.substring(0, 25) + "..." : rawTitle;
              return {
                title: cleanTitle,
                grade: `${j.classLevel || "Any Class"} (${j.subject || "All Subjects"})`,
                salary: `${j.salary?.toLocaleString() ?? "Negotiable"} BDT/month`,
                sector: j.address || "Bangladesh",
                description: j.description || "No description provided.",
                coords: `${j.approxLat?.toFixed(4) ?? (23.7 + Math.random() * 0.1).toFixed(4)}° N, ${j.approxLng?.toFixed(4) ?? (90.3 + Math.random() * 0.1).toFixed(4)}° E`
              };
            });
            setJobs(mappedJobs);
          }
        }
      } catch (err) {
        console.error("Hero live load error", err);
      }
    }
    loadData();
  }, []);

  const activeTutors = tutors.length > 0 ? tutors : DEFAULT_TUTORS;
  const activeJobs = jobs.length > 0 ? jobs : DEFAULT_JOBS;

  const jobIndex = Math.floor(mockIndex / 2) % activeJobs.length;
  const tutorIndex = Math.floor(mockIndex / 2) % activeTutors.length;

  const currentTutor = activeTutors[tutorIndex];
  const currentJob = activeJobs[jobIndex];

  const shortTutorName = currentTutor
    ? (currentTutor.name.split(" ")[0] + (currentTutor.name.split(" ")[1] ? ` ${currentTutor.name.split(" ")[1][0]}.` : ""))
    : "Fahim R.";
  const shortJobTitle = currentJob
    ? (currentJob.title.length > 18 ? currentJob.title.substring(0, 17) + "..." : currentJob.title)
    : "Grade 10 Math";

  // Dynamic coordinates on the simulated map preview
  const tutorPositions = [
    { top: "25%", left: "30%" },
    { top: "35%", left: "65%" },
    { top: "20%", left: "45%" },
    { top: "45%", left: "20%" },
    { top: "30%", left: "70%" },
  ];
  const jobPositions = [
    { bottom: "20%", right: "32%" },
    { bottom: "40%", right: "15%" },
    { bottom: "25%", right: "60%" },
    { bottom: "35%", right: "40%" },
    { bottom: "15%", right: "25%" },
  ];

  const currentTutorPos = tutorPositions[mockIndex % tutorPositions.length];
  const currentJobPos = jobPositions[mockIndex % jobPositions.length];

  // Detect mobile screens to disable expensive blur animations
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Periodic slide cycle loop for preview matches
  useEffect(() => {
    const interval = setInterval(() => {
      setMockIndex((prevIndex) => (prevIndex + 1) % 100);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleType = () => {
      if (words.length === 0) return;
      const fullWord = words[currentWordIndex % words.length];
      if (!isDeleting) {
        setCurrentText(fullWord.substring(0, currentText.length + 1));
        setTypingSpeed(100);
        if (currentText === fullWord) {
          timer = setTimeout(() => setIsDeleting(true), 1500);
          return;
        }
      } else {
        setCurrentText(fullWord.substring(0, currentText.length - 1));
        setTypingSpeed(50);
        if (currentText === "") {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
          return;
        }
      }

      timer = setTimeout(handleType, typingSpeed);
    };

    timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, typingSpeed, words]);

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-6 pb-16 lg:pt-8 lg:pb-24">
      {/* Background Decorative Element (Subtle Monochrome Grid) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(var(--foreground) 1px, transparent 1px),
              linear-gradient(90deg, var(--foreground) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px"
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 text-center lg:text-left space-y-6"
          >

            {/* Title */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl tracking-tight font-extrabold text-[var(--foreground)] sm:text-5xl md:text-6xl font-sans leading-tight"
            >
              Find the perfect <br />
              <span className="text-slate-500 drop-shadow-sm">
                {currentText}
              </span>
              <span className="inline-block w-[3px] h-[0.85em] bg-slate-400 ml-1.5 align-middle animate-pulse" />
            </motion.h1>

            {/* Sub-text */}
            <motion.p
              variants={itemVariants}
              className="max-w-2xl mx-auto lg:mx-0 text-base text-[var(--muted)] sm:text-lg md:text-xl font-normal leading-relaxed"
            >
              বাংলাদেশের প্রথম স্মার্ট ও ম্যাপ-ভিত্তিক <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border-none animate-pulse inline-block mx-1">নির্ভরযোগ্য</span> টিউশন প্ল্যাটফর্ম — সহজেই খুঁজে নিন আপনার কাছাকাছি ভেরিফাইড টিউটর ও সেরা টিউশন সুযোগ।
            </motion.p>

            {/* CTAs */}
            <div className="space-y-6 pt-6">
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 flex-wrap"
              >
                {/* Find a Tutor Button */}
                <Link href="/map?type=tutor" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative w-full sm:w-auto bg-foreground text-background font-black px-7 py-4 rounded-2xl text-base transition-all duration-300 cursor-pointer shadow-[0_8px_30px_rgba(15,23,42,0.2)] border border-foreground/10 overflow-hidden flex items-center justify-center tracking-wide font-sans hover:opacity-90"
                  >
                    {/* Shimmer light effect */}
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ animationDuration: '1.5s' }} />

                    <span>Find a Tutor</span>
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </motion.button>
                </Link>

                {/* Find Tuition Jobs Button */}
                <Link href="/map?type=tuition" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative w-full sm:w-auto px-7 py-4 rounded-2xl text-base transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-center tracking-wide font-sans font-black bg-background text-foreground hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
                  >
                    <span>Find Tuition Jobs</span>
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </motion.button>
                </Link>

                {/* Optional Satellite Matching Video Demo button */}
                {onTriggerDemo && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onTriggerDemo}
                    className="w-full sm:w-auto bg-transparent hover:bg-slate-100/50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-base transition-all duration-300 cursor-pointer flex items-center justify-center tracking-wide font-sans font-bold"
                  >
                    <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>How it Works</span>
                  </motion.button>
                )}
              </motion.div>

              {/* Login / Signup Sub-pill */}
              <motion.div
                variants={itemVariants}
                className="flex justify-center lg:justify-start"
              >
                <div className="glass-card flex items-center p-1.5 rounded-full border border-slate-800/80 bg-slate-950/80 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-emerald-500/20 transition-all duration-300 text-[10px] md:text-xs font-mono tracking-wider font-extrabold space-x-6 pl-5 pr-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <Link href="/login" className="text-slate-400 hover:text-white transition-colors uppercase tracking-widest cursor-pointer font-bold">
                      Log in
                    </Link>
                  </div>
                  <div className="h-4 w-px bg-slate-800" />
                  <Link href="/register">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-emerald-500 text-white px-6 py-2.5 rounded-full font-sans font-black tracking-widest uppercase transition-colors cursor-pointer text-[10px] md:text-xs border-none shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:brightness-110"
                    >
                      Sign up
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Hero Content: Beautiful Visual Match Engine Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.4 }}
            className="lg:col-span-5 relative mt-12 lg:mt-0"
          >
            {/* Ambient Backlight Glow */}
            <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-3xl filter blur-[80px] pointer-events-none" />

            {/* Dashboard Container */}
            <Link href="/map?type=tutor" className="block group cursor-pointer decoration-none">
              <div className="relative rounded-[2rem] border border-slate-200/60 dark:border-slate-800/80 overflow-hidden shadow-2xl p-5 sm:p-6 bg-white/60 dark:bg-slate-950/40 backdrop-blur-3xl space-y-5 group-hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)] group-hover:border-slate-300/80 dark:group-hover:border-emerald-500/30 transition-all duration-500">

                {/* Subtle internal glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none -z-10" />

                {/* Header Bar */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase">Live Match Engine</span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active Radar</span>
                  </div>
                </div>

                {/* Simulated Search Bar */}
                <div className="bg-white/90 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800/80 rounded-full p-3 px-5 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.03)] dark:shadow-inner backdrop-blur-md transition-all duration-300 group-hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center space-x-3">
                    <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">
                      {mockIndex % 2 === 1
                        ? "Tutors in Dhaka..."
                        : "Jobs in Dhaka..."}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-full">
                    1.5km radius
                  </span>
                </div>

                {/* Stylized Map View Mockup */}
                <div className="relative h-48 rounded-[1.5rem] bg-gradient-to-b from-slate-50/80 to-slate-100/80 dark:from-slate-900/60 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex items-center justify-center shadow-inner">
                  {/* Styled Map Background Grid */}
                  <div
                    className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
                    style={{
                      backgroundImage: `
                        linear-gradient(var(--foreground) 1px, transparent 1px),
                        linear-gradient(90deg, var(--foreground) 1px, transparent 1px)
                      `,
                      backgroundSize: "24px 24px"
                    }}
                  />

                  {/* Decorative map roads/paths (removed) */}

                  {/* Radar rotating sweep line and concentric sonar rings */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    {/* Concentric rings */}
                    <div className="absolute w-[280px] h-[280px] rounded-full border border-emerald-500/10 animate-pulse" />
                    <div className="absolute w-[200px] h-[200px] rounded-full border border-emerald-500/10" />
                    <div className="absolute w-[120px] h-[120px] rounded-full border border-emerald-500/15" />
                    <div className="absolute w-[40px] h-[40px] rounded-full border border-emerald-500/20" />

                    {/* Sonar sweep overlay */}
                    <div
                      className="absolute w-[400px] h-[400px] rounded-full animate-radar-sweep opacity-60 dark:opacity-100"
                      style={{
                        background: "conic-gradient(from 0deg, rgba(20, 184, 166, 0.15) 0deg, rgba(20, 184, 166, 0.04) 60deg, transparent 180deg, transparent 360deg)",
                      }}
                    />
                  </div>

                  {/* Dynamic map point 1 (Tutor) */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`tutor-pin-${mockIndex % tutorPositions.length}`}
                      initial={{ opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      style={{ top: currentTutorPos.top, left: currentTutorPos.left }}
                      className="absolute group/pin flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-20"
                    >
                      <div className="bg-white/95 dark:bg-slate-900/95 text-[10px] font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1 rounded-lg shadow-xl mb-1.5 whitespace-nowrap backdrop-blur-md">
                        Tutor: {shortTutorName}
                      </div>
                      <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-md"></span>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Dynamic map point 2 (Job) */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`job-pin-${jobPositions.length - 1 - (mockIndex % jobPositions.length)}`}
                      initial={{ opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      style={{ bottom: currentJobPos.bottom, right: currentJobPos.right }}
                      className="absolute group/pin flex flex-col items-center translate-x-1/2 translate-y-1/2 z-20"
                    >
                      <div className="bg-white/95 dark:bg-slate-900/95 text-[10px] font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1 rounded-lg shadow-xl mb-1.5 whitespace-nowrap backdrop-blur-md">
                        Job: {shortJobTitle}
                      </div>
                      <div className="relative flex h-3.5 w-3.5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 border-2 border-white dark:border-slate-900 shadow-md"></span>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent dark:from-slate-950/90 dark:via-transparent dark:to-transparent pointer-events-none" />

                  {/* Matching Status Pill */}
                  <div className="absolute bottom-4 bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700/80 px-4 py-2 rounded-full flex items-center space-x-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.06)] dark:shadow-xl backdrop-blur-md z-30">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                      {mockIndex % 2 === 1
                        ? "Discovering tutors..."
                        : "Discovering jobs..."}
                    </span>
                  </div>
                </div>

                {/* Matched Profile Preview Card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mockIndex}
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="bg-white/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-[1.5rem] p-4 shadow-lg shadow-slate-200/50 dark:shadow-md relative overflow-hidden w-full h-[150px] flex flex-col justify-between group-hover:border-emerald-500/20 transition-all duration-300 backdrop-blur-md"
                  >
                    {/* Subtle glass shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: '3s' }} />

                    {mockIndex % 2 === 1 ? (
                      <>
                        <div className="space-y-3">
                          {/* Tutor Profile Header */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/20 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="min-w-0 pr-2">
                                  <h4 className="text-sm font-bold text-[var(--foreground)] truncate">
                                    {currentTutor.name}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 font-medium">
                                    {currentTutor.specs}
                                  </p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center shadow-sm shrink-0">
                                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                    Verified
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bio */}
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 italic font-sans leading-relaxed line-clamp-2 px-1 border-l-2 border-slate-200 dark:border-slate-700 ml-1">
                            "{currentTutor.expertise}"
                          </div>
                        </div>

                        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">Univ. Verified</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Location:</span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                              🔒 Secured
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {/* Job Profile Header */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/20 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="min-w-0 pr-2">
                                  <h4 className="text-sm font-bold text-[var(--foreground)] truncate">
                                    {currentJob.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 font-medium">
                                    {currentJob.grade} • {currentJob.sector}
                                  </p>
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded-md flex items-center shadow-sm shrink-0">
                                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                    Premium Job
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Requirements */}
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 italic font-sans leading-relaxed line-clamp-2 px-1 border-l-2 border-slate-200 dark:border-slate-700 ml-1">
                            "{currentJob.description || currentJob.sector}"
                          </div>
                        </div>

                        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Budget:</span>
                            <span className="text-[11px] text-[var(--foreground)] font-bold">{currentJob.salary}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Location:</span>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center">
                              🔒 Secured
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
