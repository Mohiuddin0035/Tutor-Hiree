"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { fetchApi } from "@/lib/api";

export default function ForgotPassword() {
  const router = useRouter();
  
  // Steps: 1 = Email, 2 = OTP, 3 = New Password
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const [data, setData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSendOTP = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await fetchApi("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: data.email })
      });
      
      setMessage("An OTP code has been sent to your email.");
      setStep(2);
      setCountdown(900); // 15 minutes
    } catch (err: any) {
      setError(err.message || "Failed to dispatch OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await fetchApi("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: data.email, otp: data.otp })
      });

      setMessage("OTP Confirmed. Please establish your new security key.");
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (data.newPassword !== data.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (data.newPassword.length < 6) {
      setError("Security key must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await fetchApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ 
          email: data.email, 
          otp: data.otp,
          newPassword: data.newPassword 
        })
      });

      setMessage("Security key updated successfully! Redirecting...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update security key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Blob */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-sky-500/10 rounded-full filter blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl relative z-10 backdrop-blur-xl"
      >
        <div className="text-center space-y-2 mb-8">
          <Link href="/" className="inline-block">
            <div className="text-sky-400 font-mono text-xs uppercase tracking-widest bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full w-fit mx-auto mb-2 shadow-[0_0_10px_rgba(14,165,233,0.1)]">
              TutorHire
            </div>
          </Link>
          <h2 className="text-3xl font-bold font-heading text-white">
            Security Recovery
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-sans">
            {step === 1 && "Identify your account to receive a recovery code"}
            {step === 2 && "Input the 6-digit OTP dispatched to your address"}
            {step === 3 && "Establish a new secure access key"}
          </p>
        </div>

        <div className="min-h-[220px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6" 
                onSubmit={handleSendOTP}
              >
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Registered Email</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                    placeholder="email@example.com"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(14,165,233,0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 font-bold rounded-xl text-slate-950 bg-sky-500 hover:bg-sky-600 transition duration-200 cursor-pointer shadow-[0_4px_12px_rgba(14,165,233,0.15)] disabled:opacity-50"
                >
                  {loading ? "Dispatching..." : "Send Recovery OTP"}
                </motion.button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6" 
                onSubmit={handleVerifyOTP}
              >
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold text-center">6-Digit Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-4 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                    placeholder="••••••"
                    value={data.otp}
                    onChange={(e) => setData({ ...data, otp: e.target.value.replace(/[^0-9]/g, '') })}
                  />
                  <p className="text-center text-[10px] text-slate-500 mt-2">
                    Code sent to <span className="text-sky-400">{data.email}</span>
                  </p>
                  
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading || countdown > 0}
                    className={`w-full text-center text-xs font-semibold transition-colors mt-2 ${countdown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-sky-400'}`}
                  >
                    {countdown > 0 
                      ? `Resend OTP in ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
                      : <span>Didn't receive the code? <span className="underline underline-offset-2">Resend OTP</span></span>
                    }
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3.5 px-4 font-bold rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition duration-200 text-sm"
                  >
                    Back
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || data.otp.length !== 6}
                    className="w-2/3 py-3.5 px-4 font-bold rounded-xl text-slate-950 bg-sky-500 hover:bg-sky-600 transition duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </motion.button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form 
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6" 
                onSubmit={handleResetPassword}
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">New Security Key</label>
                    <input
                      type="password"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                      placeholder="••••••••••••"
                      value={data.newPassword}
                      onChange={(e) => setData({ ...data, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Confirm Security Key</label>
                    <input
                      type="password"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                      placeholder="••••••••••••"
                      value={data.confirmPassword}
                      onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(var(--theme-rgb),0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 font-bold rounded-xl text-slate-950 bg-emerald-500 hover:bg-emerald-600 transition duration-200 cursor-pointer shadow-[0_4px_12px_rgba(var(--theme-rgb),0.15)] disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Finalize & Update"}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 py-2.5 rounded-xl mt-4"
          >
            ⚠ {error}
          </motion.p>
        )}
        
        {message && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-emerald-400 text-xs text-center bg-emerald-500/10 border border-emerald-500/20 py-2.5 rounded-xl mt-4"
          >
            ✓ {message}
          </motion.p>
        )}

        <div className="text-sm text-center mt-6 border-t border-slate-800/80 pt-6">
          <Link href="/login" className="font-semibold text-slate-400 hover:text-slate-200 transition-colors">
            Return to Login Module
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
