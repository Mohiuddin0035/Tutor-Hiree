"use client";
import { fetchApi } from "@/lib/api";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface TuitionEstimatorProps {}

const defaultLocations = [
  "Banani",
  "Gulshan",
  "Dhanmondi",
  "Uttara",
  "Mirpur",
  "Mohammadpur",
  "Bashundhara",
  "Lalmatia",
  "Wari",
];

const defaultClassLevels = [
  "Class 1-5",
  "Class 6-8",
  "SSC (Class 9-10)",
  "HSC (Class 11-12)",
  "O/A Levels",
  "Admission Test",
];

const defaultSubjects = [
  "All Subjects",
  "Mathematics",
  "Physics",
  "Chemistry",
  "English Medium Science",
  "ICT & Computer Science",
  "IELTS/SAT Prep",
];

function getDistrict(loc: string): string {
  if (!loc) return "Dhaka";
  const lower = loc.toLowerCase();
  
  if (/agrabad|gec\s+circle|halishahar|nasirabad|panchlaish|khulshi|chawkbazar|patenga|lalkhan|bakalia|chandgaon|chittagong|ctg/i.test(lower)) {
    return "Chittagong";
  }
  if (/zindabazar|amberkhana|shibgonj|uposhahar|kumarpara|sylhet/i.test(lower)) {
    return "Sylhet";
  }
  if (/rajshahi/i.test(lower)) return "Rajshahi";
  if (/khulna/i.test(lower)) return "Khulna";
  if (/barisal/i.test(lower)) return "Barisal";
  if (/rangpur/i.test(lower)) return "Rangpur";
  if (/mymensingh/i.test(lower)) return "Mymensingh";
  if (/comilla/i.test(lower)) return "Comilla";
  if (/cox/i.test(lower)) return "Cox's Bazar";
  if (/narayanganj/i.test(lower)) return "Narayanganj";
  if (/gazipur/i.test(lower)) return "Gazipur";
  if (/savar/i.test(lower)) return "Savar";

  return "Dhaka";
}

export default function TuitionEstimator({}: TuitionEstimatorProps = {}) {
  const [locationsList, setLocationsList] = useState<string[]>(defaultLocations);
  const [classLevelsList, setClassLevelsList] = useState<string[]>(defaultClassLevels);
  const [subjectsList, setSubjectsList] = useState<string[]>(defaultSubjects);

  const [location, setLocation] = useState("Banani");
  const [classLevel, setClassLevel] = useState("SSC (Class 9-10)");
  const [subject, setSubject] = useState("All Subjects");
  const [days, setDays] = useState(3);
  const [genderPref, setGenderPref] = useState("Any");

  const [minSalary, setMinSalary] = useState(7000);
  const [maxSalary, setMaxSalary] = useState(10000);
  const [tutorDensity, setTutorDensity] = useState(42);
  const [demandIndex, setDemandIndex] = useState<"critical" | "high" | "moderate">("high");
  const [matchTime, setMatchTime] = useState("Within 24 Hours");
  const [loading, setLoading] = useState(false);

  // Fetch initial option lists on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const data = await fetchApi("/market-data");
        if (data) {
          if (data.locations && data.locations.length > 0) {
            setLocationsList(data.locations);
            // Ensure selected location is in list
            if (!data.locations.includes(location)) {
              setLocation(data.locations[0]);
            }
          }
          if (data.classLevels && data.classLevels.length > 0) {
            setClassLevelsList(data.classLevels);
            if (!data.classLevels.includes(classLevel)) {
              setClassLevel(data.classLevels[0]);
            }
          }
          if (data.subjects && data.subjects.length > 0) {
            setSubjectsList(data.subjects);
            if (!data.subjects.includes(subject)) {
              setSubject(data.subjects[0]);
            }
          }
        }
      } catch (err) {
        console.warn("Meta loading error", err);
      }
    }
    loadMeta();
  }, []);

  // Fetch estimates when inputs change
  useEffect(() => {
    let active = true;
    async function fetchEstimates() {
      setLoading(true);
      try {
        const url = `/api/market-data?location=${encodeURIComponent(
          location
        )}&classLevel=${encodeURIComponent(classLevel)}&subject=${encodeURIComponent(
          subject
        )}&days=${days}`;
        const data = await fetchApi(url.replace('/api', ''));
        if (data && active) {
          setMinSalary(data.minSalary);
          setMaxSalary(data.maxSalary);
          setTutorDensity(data.tutorDensity);
          setDemandIndex(data.demandIndex);
          setMatchTime(data.matchTime);
        }
      } catch (err) {
        console.warn("Error fetching estimates", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchEstimates();
    return () => {
      active = false;
    };
  }, [location, classLevel, subject, days]);

  return (
    <section className="py-20 relative overflow-hidden bg-slate-950/20 border-y border-slate-800/20">
      {/* Glow effects */}
      <div className="hidden md:block absolute top-1/2 left-1/3 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="hidden md:block absolute top-1/3 right-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="flex justify-center items-center gap-3">
            <div className="inline-block text-emerald-500 font-mono text-xs uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(var(--theme-rgb),0.1)]">
              Market Intelligence Tool
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold font-heading text-[var(--foreground)] tracking-tight">
            Salary & Demand Estimator
          </h2>
          <p className="text-[var(--muted)] text-sm md:text-base font-sans">
            Calculate fair tuition market rates, examine matching speed indices, and review verified educator density at your exact coordinates.
          </p>
        </div>

        {/* Tactical Control Board Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-6 flex flex-col justify-between p-6 rounded-2xl border border-slate-800/80 bg-slate-950/30 glass-card">
            <div className="space-y-6">
              <div className="border-b border-slate-800/80 pb-4">
                <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">
                  Configure Parameters
                </span>
                <h3 className="text-lg font-bold font-heading text-[var(--foreground)] mt-1">
                  Tuition Specifications
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Location Select */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Location Area
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200 cursor-pointer"
                  >
                    {locationsList.map((loc) => (
                      <option key={loc} value={loc} className="bg-slate-950">
                        {loc}, {getDistrict(loc)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Level Select */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Class / Standard
                  </label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200 cursor-pointer"
                  >
                    {classLevelsList.map((lvl) => (
                      <option key={lvl} value={lvl} className="bg-slate-950">
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subject Select */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Subject Specialty
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200 cursor-pointer"
                  >
                    {subjectsList.map((sub) => (
                      <option key={sub} value={sub} className="bg-slate-950">
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender Preference Select */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Tutor Gender Preference
                  </label>
                  <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                    {["Any", "Female", "Male"].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setGenderPref(gender)}
                        className={`flex-1 py-2 rounded-lg text-xs font-mono transition-colors border-none bg-transparent cursor-pointer ${
                          genderPref === gender
                            ? "bg-emerald-500/10 text-emerald-400 font-bold"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Days/Week Slider */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <span>Frequency / Weekly Days</span>
                  <span className="text-emerald-400 font-bold">{days} Days a Week</span>
                </div>
                <div className="flex items-center space-x-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <input
                    type="range"
                    min="2"
                    max="5"
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    className="flex-grow accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex space-x-1">
                    {[2, 3, 4, 5].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDays(d)}
                        className={`w-7 h-7 rounded-lg text-[10px] font-mono flex items-center justify-center transition-all border cursor-pointer ${
                          days === d
                            ? "bg-emerald-500 border-emerald-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(var(--theme-rgb),0.3)]"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Output Insights Dashboard */}
          <div className="lg:col-span-6 flex flex-col justify-between p-6 rounded-2xl border border-slate-800/80 bg-slate-950/30 glass-card relative">
            {/* Smooth spinner mask when loading */}
            {loading && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-20">
                <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
              </div>
            )}

            <div className="space-y-6">
              <div className="border-b border-slate-800/80 pb-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">
                    Live Analytics
                  </span>
                  <h3 className="text-lg font-bold font-heading text-[var(--foreground)] mt-1">
                    Market Intelligence Output
                  </h3>
                </div>
                <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 inline-block" />
                  Live Sync
                </span>
              </div>

              {/* ESTIMATED SALARY BIG PANEL */}
              <div className="relative p-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center overflow-hidden shadow-[0_0_30px_rgba(var(--theme-rgb),0.02)] min-h-[140px]">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 block">
                  Estimated Monthly Salary Range
                </span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${minSalary}-${maxSalary}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="text-2xl sm:text-3xl md:text-4xl font-black text-emerald-400 tracking-tight font-sans"
                  >
                    {minSalary.toLocaleString()} - {maxSalary.toLocaleString()} BDT
                  </motion.div>
                </AnimatePresence>
                <span className="text-[10px] text-slate-500 font-mono mt-2">
                  Calculated based on {days} days/week standard in {location}
                </span>
              </div>

              {/* THREE DYNAMIC KPI COLUMNS */}
              <div className="grid grid-cols-3 gap-3">
                {/* Demand level */}
                <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex flex-col justify-between h-20 text-center items-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">
                    Demand Level
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={demandIndex}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`text-[10px] sm:text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        demandIndex === "critical"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : demandIndex === "high"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {demandIndex === "critical"
                        ? "🔥 CRITICAL"
                        : demandIndex === "high"
                          ? "⚡ HIGH"
                          : "🌱 STABLE"}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-[7.5px] text-slate-500 font-sans">Index Score</span>
                </div>

                {/* Tutor Pool Density */}
                <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex flex-col justify-between h-20 text-center items-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">
                    Tutors Nearby
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={tutorDensity}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-xs sm:text-sm font-bold text-emerald-400 font-sans"
                    >
                      {tutorDensity} Online
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-[7.5px] text-slate-500 font-sans">Verified Tutors</span>
                </div>

                {/* Match Time Index */}
                <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex flex-col justify-between h-20 text-center items-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">
                    Est. Match Time
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={matchTime}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-[10px] sm:text-xs font-bold text-indigo-400 font-mono"
                    >
                      {matchTime}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-[7.5px] text-slate-500 font-sans">Standard Speed</span>
                </div>
              </div>
            </div>

            {/* ACTION DIRECTIVE CTA */}
            <div className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href={`/map?type=tutor`} className="block w-full">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-md flex items-center justify-center space-x-1.5 border-none"
                  >
                    <span>Find Verified Tutors</span>
                  </motion.button>
                </Link>
                <Link href={`/map?type=job`} className="block w-full">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-100 font-bold py-3.5 rounded-xl text-xs transition duration-200 cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>Search Tuition Jobs</span>
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
