"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import NavbarWrapper from "@/components/NavbarWrapper";
import { detectFaceInImage } from "@/lib/faceDetection";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import ProgressTracker from "@/components/ProgressTracker";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] w-full bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center animate-pulse">
      <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full mr-2" />
      <span className="text-xs text-slate-400 font-mono">Initializing pick map...</span>
    </div>
  ),
});

const EDUCATION_LEVELS = [
  "Secondary School Certificate (SSC)",
  "Higher Secondary Certificate (HSC)",
  "Diploma / Technical Certificate",
  "Bachelor of Science (B.Sc)",
  "Bachelor of Arts (B.A)",
  "Bachelor of Business Administration (B.B.A)",
  "Bachelor of Social Science (B.S.S)",
  "Master of Science (M.Sc)",
  "Master of Arts (M.A)",
  "Master of Business Administration (M.B.A)",
  "Doctor of Philosophy (Ph.D) / Doctorate",
  "BCS Cadre Officer",
  "School Teacher",
  "College Lecturer",
  "University Professor / Lecturer",
  "Coaching Center Instructor"
];

const validateImageContent = async (file: File, type: "nid" | "idcard"): Promise<boolean> => {
  try {
    const Tesseract = (await import("tesseract.js")).default;
    const result = await Tesseract.recognize(file, "eng");
    const text = result.data.text.toLowerCase();
    console.log("OCR scan text outcome:", text);

    if (type === "nid") {
      const nidKeywords = [
        "national", "identity", "card", "bangladesh", "government", 
        "birth", "nid", "no", "number", "name", "father", "mother",
        "republic", "peoples", "issue", "date"
      ];
      const matches = nidKeywords.filter((keyword) => text.includes(keyword));
      console.log("Dashboard NID Matches:", matches);
      return matches.length >= 1;
    } else {
      const idKeywords = [
        "student", "id", "card", "university", "college", "school",
        "registration", "roll", "valid", "expiry", "class", "semester",
        "session", "institute", "hall", "department", "academic"
      ];
      const matches = idKeywords.filter((keyword) => text.includes(keyword));
      console.log("Dashboard Student ID Matches:", matches);
      return matches.length >= 1;
    }
  } catch (err) {
    console.error("OCR validation crashed, bypassing:", err);
    return true; // Bypass to not block users on engine failures
  }
};

export default function Dashboard() {
  const { data: session, status } = useSession() || { data: null, status: "unauthenticated" };
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [education, setEducation] = useState("");
  const [educationType, setEducationType] = useState("select"); // "select" or "custom"
  const [customEducation, setCustomEducation] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [preferableTime, setPreferableTime] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [reactivationRequested, setReactivationRequested] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("UNVERIFIED");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectedAt, setRejectedAt] = useState("");
  const [latitude, setLatitude] = useState(23.8103);
  const [longitude, setLongitude] = useState(90.4125);
  const [actualLatitude, setActualLatitude] = useState<number | null>(null);
  const [actualLongitude, setActualLongitude] = useState<number | null>(null);
  const [hasConfirmedTuition, setHasConfirmedTuition] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [hasAssignedTutor, setHasAssignedTutor] = useState(false);
  const [assignedTutors, setAssignedTutors] = useState<any[]>([]);
  const [tutorSeq, setTutorSeq] = useState<number | null>(null);
  const [tutorJobs, setTutorJobs] = useState<any[]>([]);
  const [payLaterJob, setPayLaterJob] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<"success" | "error" | "info">("info");
  const [popupMessage, setPopupMessage] = useState("");

  const [requestModalJob, setRequestModalJob] = useState<any>(null);
  const [helplineModalJob, setHelplineModalJob] = useState<any>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Commission payment states
  const [commissionTrxId, setCommissionTrxId] = useState("");
  const [payingCommissionJobId, setPayingCommissionJobId] = useState<string | null>(null);
  const [requestingRefundJobId, setRequestingRefundJobId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  // Verification document preview states
  const [nidPreviewUrl, setNidPreviewUrl] = useState("");
  const [studentIdPreviewUrl, setStudentIdPreviewUrl] = useState("");
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState("");
  const [fileNameNid, setFileNameNid] = useState("");
  const [fileNameStudentId, setFileNameStudentId] = useState("");
  const [fileNameSelfie, setFileNameSelfie] = useState("");

  const handleNidChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileNameNid(file.name);
    setNidPreviewUrl("");
    
    setPopupType("info");
    setPopupMessage("Scanning National ID (NID) Scan authenticity...");
    setPopupOpen(true);

    try {
      const isAuthentic = await validateImageContent(file, "nid");
      if (!isAuthentic) {
        setPopupType("error");
        setPopupMessage("Invalid Document Scan: The uploaded image does not appear to be a valid National ID Card (NID). Please upload a clear photo of your NID card.");
        setPopupOpen(true);
        e.target.value = "";
        setFileNameNid("");
        return;
      }
      
      const localUrl = URL.createObjectURL(file);
      setNidPreviewUrl(localUrl);
      setPopupType("success");
      setPopupMessage("✓ National ID (NID) Scan verified successfully!");
      setPopupOpen(true);
    } catch (err) {
      console.error(err);
      setPopupType("error");
      setPopupMessage("Failed to validate NID scan. Please try again.");
      setPopupOpen(true);
    }
  };

  const handleStudentIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileNameStudentId(file.name);
    setStudentIdPreviewUrl("");
    
    setPopupType("info");
    setPopupMessage("Scanning Student ID Card authenticity...");
    setPopupOpen(true);

    try {
      const isAuthentic = await validateImageContent(file, "idcard");
      if (!isAuthentic) {
        setPopupType("error");
        setPopupMessage("Invalid Document Scan: The uploaded image does not appear to be a valid Student ID Card. Please upload a clear photo of your student ID card.");
        setPopupOpen(true);
        e.target.value = "";
        setFileNameStudentId("");
        return;
      }
      
      const localUrl = URL.createObjectURL(file);
      setStudentIdPreviewUrl(localUrl);
      setPopupType("success");
      setPopupMessage("✓ Student ID Card scan verified successfully!");
      setPopupOpen(true);
    } catch (err) {
      console.error(err);
      setPopupType("error");
      setPopupMessage("Failed to validate Student ID scan. Please try again.");
      setPopupOpen(true);
    }
  };

  const handleSelfieChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileNameSelfie(file.name);
    setSelfiePreviewUrl("");

    setPopupType("info");
    setPopupMessage("Validating Tutor Photo authenticity...");
    setPopupOpen(true);

    try {
      const isRealHuman = await detectFaceInImage(file);
      if (!isRealHuman) {
        setPopupType("error");
        setPopupMessage("Invalid Profile Picture: The uploaded image does not appear to be a real human photo or clear portrait shot. Please upload a clear photo of your face.");
        setPopupOpen(true);
        e.target.value = "";
        setFileNameSelfie("");
        return;
      }

      const localUrl = URL.createObjectURL(file);
      setSelfiePreviewUrl(localUrl);
      setPopupType("success");
      setPopupMessage("✓ Tutor Photo verified successfully!");
      setPopupOpen(true);
    } catch (err) {
      console.error(err);
      setPopupType("error");
      setPopupMessage("Failed to validate Tutor Photo. Please try again.");
      setPopupOpen(true);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const loadDashboardData = () => {
    if (session) {
      if ((session.user as any)?.role === "ADMIN") {
        router.push("/dashboard/admin");
        return;
      }

      fetch(`/api/profile?t=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.phone) setPhone(data.phone);
          if (data.address) setAddress(data.address);
          if (data.education) {
            setEducation(data.education);
            if (EDUCATION_LEVELS.includes(data.education)) {
              setEducationType("select");
            } else {
              setEducationType("custom");
              setCustomEducation(data.education);
            }
          }
          if (data.bio) setBio(data.bio);
          if (data.gender) setGender(data.gender);
          if (data.preferable_time) setPreferableTime(data.preferable_time);
          if (data.is_active !== undefined) setIsActive(data.is_active);
          if (data.reactivationRequested !== undefined) setReactivationRequested(data.reactivationRequested);
          if (data.verificationStatus) setVerificationStatus(data.verificationStatus);
          if (data.rejectionReason) setRejectionReason(data.rejectionReason);
          if (data.rejectedAt) setRejectedAt(data.rejectedAt);
          if (data.latitude) setLatitude(data.latitude);
          if (data.longitude) setLongitude(data.longitude);
          if (data.actualLatitude) setActualLatitude(data.actualLatitude);
          if (data.actualLongitude) setActualLongitude(data.actualLongitude);
          if (data.hasConfirmedTuition !== undefined) setHasConfirmedTuition(data.hasConfirmedTuition);
          if (data.reviews) setReviews(data.reviews);
          if (data.averageRating !== undefined) setAverageRating(data.averageRating);
          if (data.assignedTutors) setAssignedTutors(data.assignedTutors);
          if (data.tutorSeq !== undefined) setTutorSeq(data.tutorSeq);
          if (data.tutorJobs) setTutorJobs(data.tutorJobs);
          if (data.paymentHistory) setPaymentHistory(data.paymentHistory);

          // Fetch parent's own listings
          if (data.role === "PARENT" || (session.user as any)?.role === "PARENT") {
            fetch("/api/jobs?mine=true")
              .then((r) => r.json())
              .then((jobs) => setMyJobs(Array.isArray(jobs) ? jobs : []))
              .catch(() => {});
          }
        })
        .catch((err) => console.error("Error loading profile:", err));
    }
  };

  const handleAcceptRequest = async (jobId: string) => {
    setIsAccepting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          action: "accept",
        })
      });
      if (res.ok) {
        setRequestModalJob(null);
        setPopupType("success");
        setPopupMessage("✓ Request accepted! Please pay the 10% commission fee from your dashboard to unlock parent contact details.");
        setPopupOpen(true);
        loadDashboardData();
      } else {
        const txt = await res.text();
        setPopupType("error");
        setPopupMessage(txt || "Failed to accept direct request.");
        setPopupOpen(true);
      }
    } catch (e) {
      setPopupType("error");
      setPopupMessage("Network error accepting request.");
      setPopupOpen(true);
    } finally {
      setIsAccepting(false);
    }
  };

  const handlePayCommission = async (jobId: string) => {
    if (!commissionTrxId.trim()) {
      setPopupType("error");
      setPopupMessage("Please enter your bKash/Nagad Transaction ID (TrxID).");
      setPopupOpen(true);
      return;
    }
    setPayingCommissionJobId(jobId);
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          action: "pay-commission",
          trxId: commissionTrxId.trim(),
        })
      });
      if (res.ok) {
        setCommissionTrxId("");
        setPopupType("success");
        setPopupMessage("✓ Commission paid successfully! Full parent contact details have been unlocked.");
        setPopupOpen(true);
        loadDashboardData();
      } else {
        const txt = await res.text();
        setPopupType("error");
        setPopupMessage(txt || "Failed to process commission payment.");
        setPopupOpen(true);
      }
    } catch (e) {
      setPopupType("error");
      setPopupMessage("Network error processing payment.");
      setPopupOpen(true);
    } finally {
      setPayingCommissionJobId(null);
    }
  };

  const handleRequestRefund = async (jobId: string) => {
    setRequestingRefundJobId(jobId);
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          action: "request-refund",
          reason: refundReason || "Requesting refund",
        })
      });
      if (res.ok) {
        setRefundReason("");
        setPopupType("success");
        setPopupMessage("✓ Refund request submitted! Admin will review within 24 hours.");
        setPopupOpen(true);
        loadDashboardData();
      } else {
        const txt = await res.text();
        setPopupType("error");
        setPopupMessage(txt || "Failed to request refund.");
        setPopupOpen(true);
      }
    } catch (e) {
      setPopupType("error");
      setPopupMessage("Network error requesting refund.");
      setPopupOpen(true);
    } finally {
      setRequestingRefundJobId(null);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Securing Dashboard Session...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const role = (session.user as any)?.role || "PARENT";
  const email = session.user?.email || "";

  const handleRequestReactivation = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reactivationRequested: true,
        }),
      });
      if (res.ok) {
        setReactivationRequested(true);
        setPopupType("success");
        setPopupMessage("Your reactivation request has been sent successfully. Please allow up to 24 hours for review, or call our helpline at 096-96-847-847 for immediate assistance.");
        setPopupOpen(true);
      } else {
        setPopupType("error");
        setPopupMessage("Failed to send reactivation request.");
        setPopupOpen(true);
      }
    } catch (err) {
      console.error(err);
      setPopupType("error");
      setPopupMessage("An error occurred while sending reactivation request.");
      setPopupOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phone, 
          address, 
          bio, 
          education,
          gender: role === "TUTOR" ? gender : undefined,
          preferable_time: role === "TUTOR" ? preferableTime : undefined,
          is_active: role === "TUTOR" ? isActive : undefined,
          latitude,
          longitude,
          actualLatitude,
          actualLongitude
        }),
      });

      if (res.ok) {
        setProfileMessage("✓ Profile configurations updated successfully!");
      } else {
        setProfileMessage("Failed to update profile settings.");
      }
    } catch (err) {
      console.error("SAVE_PROFILE_ERROR", err);
      setProfileMessage("An error occurred while saving profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <NavbarWrapper />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 w-full flex-grow">
        {/* Profile Welcome Header */}
        <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-800 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-500/5 rounded-full filter blur-[50px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold font-heading text-white tracking-tight">
                Welcome, {session.user?.name || "Operator"}
              </h1>
              <p className="text-slate-400 text-sm font-mono flex items-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(var(--theme-rgb),0.8)] animate-pulse" />
                Logged in as: <span className="text-emerald-400 ml-1 font-bold uppercase tracking-wider">{role}</span>
                <span className="ml-3 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs rounded font-bold font-mono">
                  {role === "TUTOR"
                    ? `TC-${String(tutorSeq && tutorSeq > 0 ? tutorSeq : 1).padStart(3, '0')}`
                    : `TP-${String(tutorSeq && tutorSeq > 0 ? tutorSeq : 1).padStart(3, '0')}`}
                </span>
              </p>
            </div>

            {role === "TUTOR" ? (
              verificationStatus === "VERIFIED" ? (
                <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(var(--theme-rgb),0.05)] w-fit font-bold">
                  <svg className="w-4 h-4 mr-1 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Verified Tutor Badge Active
                </div>
              ) : verificationStatus === "PENDING" ? (
                <div className="flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.05)] w-fit font-bold">
                  <svg className="w-4 h-4 mr-1 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verification Request Pending
                </div>
              ) : verificationStatus === "REJECTED" ? (
                <div className="flex flex-col md:items-end gap-2 text-right">
                  <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.05)] w-fit font-bold md:ml-auto">
                    <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verification Rejected
                  </div>
                  {rejectionReason && (
                    <div className="bg-red-950/20 border border-red-900/30 text-red-400 p-3.5 rounded-xl text-xs max-w-md text-left font-sans space-y-1.5 shadow-inner">
                      <div className="font-bold flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Rejection Explanation
                      </div>
                      <p className="leading-relaxed font-sans">{rejectionReason}</p>
                      {rejectedAt && (
                        <div className="text-[10px] text-red-500/80 font-mono mt-1 pt-1 border-t border-red-900/20">
                          Declined: {new Date(rejectedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.05)] w-fit">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Unverified Profile State
                </div>
              )
            ) : (
              <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(var(--theme-rgb),0.05)] w-fit">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Parent Account Active
              </div>
            )}
          </div>
        </div>

        {role === "TUTOR" && !isActive && (
          <div className="glass-card rounded-2xl p-6 md:p-8 border border-red-500/20 bg-slate-950 mb-8 relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-500/5 rounded-full filter blur-[50px] pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold font-heading text-red-400 flex items-center gap-2">
                  <span className="animate-pulse h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  Account Deactivated
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-2xl">
                  Your tutor profile is currently marked as inactive. To reactivate your account and start receiving tuition requests, please call our call center or click "Request Reactivation" below to notify the administrator.
                </p>
                <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-2 text-xs font-mono text-slate-300 w-fit">
                  <span>Helpline:</span>
                  <span className="font-bold text-red-400">096-96-847-847</span>
                </div>
              </div>
              <div className="shrink-0">
                {reactivationRequested ? (
                  <div className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-5 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-center animate-pulse">
                    ✓ Reactivation Request Pending
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestReactivation}
                    className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-3 rounded-xl transition duration-200 cursor-pointer text-xs font-mono uppercase tracking-wider shadow-[0_4px_12px_rgba(239,68,68,0.15)] border-none"
                  >
                    Request Reactivation
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Column 1: Profile Settings (Left) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Profile Coordinates</h2>
                <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">Configure local details</p>
              </div>
              <div className="h-px bg-slate-800/80" />

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                    placeholder="+880 17XXXXXXXX"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Address / Area</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                    placeholder="Banani, Bangladesh"
                  />
                </div>

                {/* Map Geolocation Selector */}
                <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-800 rounded-2xl">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Coordinates Resolution Map
                  </label>
                  <MapPicker
                    initialLat={latitude}
                    initialLng={longitude}
                    onChange={({ lat, lng, actualLat, actualLng }) => {
                      setLatitude(lat);
                      setLongitude(lng);
                      if (actualLat !== undefined) setActualLatitude(actualLat);
                      if (actualLng !== undefined) setActualLongitude(actualLng);
                    }}
                  />
                </div>

                {role === "TUTOR" && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Highest Education Level</label>
                      <select
                        value={educationType === "custom" ? "Other" : education}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "Other") {
                            setEducationType("custom");
                            setEducation(customEducation || "");
                          } else {
                            setEducationType("select");
                            setEducation(val);
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 cursor-pointer"
                      >
                        <option value="" disabled className="bg-slate-950 text-slate-500">-- Select Education Level --</option>
                        {EDUCATION_LEVELS.map((level) => (
                          <option key={level} value={level} className="bg-slate-950 text-slate-100">
                            {level}
                          </option>
                        ))}
                        <option value="Other" className="bg-slate-950 text-indigo-400 font-bold">
                          Other (Specify Custom Level)
                        </option>
                      </select>

                      {educationType === "custom" && (
                        <input
                          type="text"
                          required
                          value={customEducation}
                          onChange={(e) => {
                            setCustomEducation(e.target.value);
                            setEducation(e.target.value);
                          }}
                          placeholder="Type your custom educational details (e.g. B.Sc in CSE from BUET)"
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 mt-1.5 animate-fadeIn"
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Short Bio / Specialty</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                        placeholder="e.g. O-Level Math and Physics Specialist"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 cursor-pointer"
                        >
                          <option value="" disabled className="bg-slate-950 text-slate-500">-- Select --</option>
                          <option value="Male" className="bg-slate-950 text-slate-100">Male</option>
                          <option value="Female" className="bg-slate-950 text-slate-100">Female</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Preferable Time</label>
                        <select
                          value={preferableTime}
                          onChange={(e) => setPreferableTime(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 cursor-pointer"
                        >
                          <option value="" disabled className="bg-slate-950 text-slate-500">-- Select --</option>
                          <option value="Available All Day" className="bg-slate-950 text-slate-100">Available All Day</option>
                           <option value="Morning (8:00 AM - 12:00 PM)" className="bg-slate-950 text-slate-100">Morning (8:00 AM - 12:00 PM)</option>
                           <option value="Afternoon (12:00 PM - 4:00 PM)" className="bg-slate-950 text-slate-100">Afternoon (12:00 PM - 4:00 PM)</option>
                           <option value="Evening (4:00 PM - 8:00 PM)" className="bg-slate-950 text-slate-100">Evening (4:00 PM - 8:00 PM)</option>
                           <option value="Night (8:00 PM - 11:00 PM)" className="bg-slate-950 text-slate-100">Night (8:00 PM - 11:00 PM)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 bg-slate-950 border-slate-800 rounded focus:ring-emerald-500 focus:ring-offset-slate-950 cursor-pointer"
                      />
                      <label htmlFor="isActive" className="text-xs font-mono uppercase text-slate-300 font-semibold cursor-pointer select-none">
                        Active & Available for Assignments
                      </label>
                    </div>
                  </>
                )}

                <AnimatePresence>
                  {profileMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-3 rounded-xl font-mono"
                    >
                      {profileMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 py-3 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                      <span>Saving config...</span>
                    </>
                  ) : (
                    <span>Save Config</span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Column 2: Role Specific Board (Right) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
              {role === "TUTOR" ? (
                // TUTOR INTERFACE
                <>
                  {verificationStatus !== "VERIFIED" ? (
                    <>
                      <div>
                        <h2 className="text-xl font-bold font-heading text-white">Operator Verification</h2>
                        <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">Acquire verified credentials badge</p>
                      </div>
                      <div className="h-px bg-slate-800/80" />
                      <p className="text-sm text-slate-400 leading-relaxed font-sans">
                        Submit your NID, passport scan, or student ID credentials. Verified tutors receive a badge on search popups and enjoy much higher matching priority.
                      </p>

                  <form
                      onSubmit={async (e) => {
                      e.preventDefault();
                      const formEl = e.currentTarget;
                      setIsSubmittingVerify(true);

                      try {
                        const nidInput = formEl.nidImage as HTMLInputElement;
                        const studentIdInput = formEl.studentIdImage as HTMLInputElement;
                        const selfieInput = formEl.selfieImage as HTMLInputElement;

                        const nidFile = nidInput.files?.[0];
                        const studentIdFile = studentIdInput.files?.[0];
                        const selfieFile = selfieInput.files?.[0];

                        if (!nidFile && !studentIdFile && !selfieFile) {
                          setPopupType("error");
                          setPopupMessage("Please select at least one document scan or selfie to upload.");
                          setPopupOpen(true);
                          setIsSubmittingVerify(false);
                          return;
                        }

                        // 0. OCR authentic documents validation to block fake pictures uploads
                        if (nidFile) {
                          const isNidAuthentic = await validateImageContent(nidFile, "nid");
                          if (!isNidAuthentic) {
                            setPopupType("error");
                            setPopupMessage("Invalid Document Scan: The uploaded image does not appear to be a valid National ID Card (NID). Please upload a clear photo of your NID card to verify your tutor account.");
                            setPopupOpen(true);
                            setIsSubmittingVerify(false);
                            return;
                          }
                        }

                        if (studentIdFile) {
                          const isIdAuthentic = await validateImageContent(studentIdFile, "idcard");
                          if (!isIdAuthentic) {
                            setPopupType("error");
                            setPopupMessage("Invalid Document Scan: The uploaded image does not appear to be a valid Student or Academic ID Card. Please upload a clear photo of your student ID card.");
                            setPopupOpen(true);
                            setIsSubmittingVerify(false);
                            return;
                          }
                        }

                        if (selfieFile) {
                          const isRealHuman = await detectFaceInImage(selfieFile);
                          if (!isRealHuman) {
                            setPopupType("error");
                            setPopupMessage("Invalid Profile Picture: The uploaded image does not appear to be a real human photo or clear portrait shot. Please upload a clear photo of your face.");
                            setPopupOpen(true);
                            setIsSubmittingVerify(false);
                            return;
                          }
                        }

                        let nidUrl = "";
                        let studentIdUrl = "";
                        let selfieUrl = "";

                        // 1. Upload NID Scan if selected
                        if (nidFile) {
                          const uploadRes = await fetch(`/api/upload?context=tutor&filename=${encodeURIComponent("nid-" + nidFile.name)}`, {
                            method: "POST",
                            body: nidFile,
                          });

                          if (!uploadRes.ok) {
                            throw new Error("Failed to upload National ID scan.");
                          }

                          const blobJson = await uploadRes.json();
                          nidUrl = blobJson.url;
                        }

                        // 2. Upload Student ID Scan if selected
                        if (studentIdFile) {
                          const uploadRes = await fetch(`/api/upload?context=tutor&filename=${encodeURIComponent("stud-" + studentIdFile.name)}`, {
                            method: "POST",
                            body: studentIdFile,
                          });

                          if (!uploadRes.ok) {
                            throw new Error("Failed to upload Student ID scan.");
                          }

                          const blobJson = await uploadRes.json();
                          studentIdUrl = blobJson.url;
                        }

                        // 3. Upload Selfie if selected
                        if (selfieFile) {
                          const uploadRes = await fetch(`/api/upload?context=tutor&filename=${encodeURIComponent("selfie-" + selfieFile.name)}`, {
                            method: "POST",
                            body: selfieFile,
                          });

                          if (!uploadRes.ok) {
                            throw new Error("Failed to upload Selfie holding ID.");
                          }

                          const blobJson = await uploadRes.json();
                          selfieUrl = blobJson.url;
                        }

                        // 4. Log profile verification in real database
                        const res = await fetch("/api/profile/verify", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            nidImageUrl: nidUrl || undefined,
                            universityIdImageUrl: studentIdUrl || undefined,
                            selfieImageUrl: selfieUrl || undefined,
                          }),
                        });

                        setIsSubmittingVerify(false);
                        if (res.ok) {
                          setVerificationStatus("PENDING");
                          setRejectionReason("");
                          setRejectedAt("");
                          setPopupType("success");
                          setPopupMessage("✓ Credentials uploaded and verification request logged! Your files are now under verification by the TutorHire Admin.");
                          setPopupOpen(true);
                          formEl.reset();
                        } else {
                          setPopupType("error");
                          setPopupMessage("Failed to record verification request. Please try again.");
                          setPopupOpen(true);
                        }
                      } catch (error: any) {
                        console.error("UPLOAD_VERIFY_ERROR", error);
                        setPopupType("error");
                        setPopupMessage(error?.message || "An error occurred during credential upload. Please try again.");
                        setPopupOpen(true);
                        setIsSubmittingVerify(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* NID Card */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                          National ID (NID) Scan
                        </label>
                        
                        <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 text-center bg-slate-950/40 transition-colors duration-200 relative group flex flex-col items-center justify-center min-h-[140px] cursor-pointer">
                          <input
                            type="file"
                            name="nidImage"
                            disabled={verificationStatus === "PENDING" || isSubmittingVerify}
                            accept="image/*"
                            onChange={handleNidChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
                          />

                          {!fileNameNid && (
                            <div className="space-y-2 pointer-events-none flex flex-col items-center">
                              <svg className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                              </svg>
                              <p className="text-xs text-slate-400">
                                Drop or <span className="text-emerald-400 font-semibold">browse NID</span>
                              </p>
                            </div>
                          )}

                          {fileNameNid && nidPreviewUrl && (
                            <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden z-10 pointer-events-none">
                              <img
                                src={nidPreviewUrl}
                                alt="NID Preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center p-3 text-center">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 mb-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <p className="text-[10px] text-emerald-400 font-bold font-mono">✓ NID Selected</p>
                                <p className="text-[8px] text-slate-300 truncate max-w-full px-1">{fileNameNid}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Student ID Card */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                          Student ID Card Scan
                        </label>
                        
                        <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 text-center bg-slate-950/40 transition-colors duration-200 relative group flex flex-col items-center justify-center min-h-[140px] cursor-pointer">
                          <input
                            type="file"
                            name="studentIdImage"
                            disabled={verificationStatus === "PENDING" || isSubmittingVerify}
                            accept="image/*"
                            onChange={handleStudentIdChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
                          />

                          {!fileNameStudentId && (
                            <div className="space-y-2 pointer-events-none flex flex-col items-center">
                              <svg className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                              </svg>
                              <p className="text-xs text-slate-400">
                                Drop or <span className="text-emerald-400 font-semibold">browse ID</span>
                              </p>
                            </div>
                          )}

                          {fileNameStudentId && studentIdPreviewUrl && (
                            <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden z-10 pointer-events-none">
                              <img
                                src={studentIdPreviewUrl}
                                alt="Student ID Preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center p-3 text-center">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 mb-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <p className="text-[10px] text-emerald-400 font-bold font-mono">✓ Student ID Selected</p>
                                <p className="text-[8px] text-slate-300 truncate max-w-full px-1">{fileNameStudentId}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tutor Photo */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                          Tutor Photo / Picture
                        </label>
                        
                        <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 text-center bg-slate-950/40 transition-colors duration-200 relative group flex flex-col items-center justify-center min-h-[140px] cursor-pointer">
                          <input
                            type="file"
                            name="selfieImage"
                            disabled={verificationStatus === "PENDING" || isSubmittingVerify}
                            accept="image/*"
                            onChange={handleSelfieChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
                          />

                          {!fileNameSelfie && (
                            <div className="space-y-2 pointer-events-none flex flex-col items-center">
                              <svg className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                              </svg>
                              <p className="text-xs text-slate-400">
                                Drop or <span className="text-emerald-400 font-semibold">browse Photo</span>
                              </p>
                            </div>
                          )}

                          {fileNameSelfie && selfiePreviewUrl && (
                            <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden z-10 pointer-events-none">
                              <img
                                src={selfiePreviewUrl}
                                alt="Tutor Photo Preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center p-3 text-center">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 mb-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <p className="text-[10px] text-emerald-400 font-bold font-mono">✓ Photo Selected</p>
                                <p className="text-[8px] text-slate-300 truncate max-w-full px-1">{fileNameSelfie}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {verificationStatus === "PENDING" && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4.5 rounded-2xl text-xs font-mono text-amber-400 leading-normal text-left flex items-start gap-2.5 animate-fadeIn">
                        <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <div>
                          <span className="font-bold block mb-1">Verification Request Under Review</span>
                          Credentials submitted and currently under review by our operations console. Re-uploading is disabled until verification is finalized by the admin.
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={verificationStatus === "PENDING" || isSubmittingVerify}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition duration-200 cursor-pointer shadow-[0_4px_12px_rgba(var(--theme-rgb),0.1)] flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed border-none"
                    >
                      {isSubmittingVerify ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                          <span>Uploading credentials...</span>
                        </>
                      ) : (
                        <span>Submit for Verification</span>
                      )}
                    </button>
                  </form>
                  </>
                  ) : (
                    <>
                      <div>
                        <h2 className="text-xl font-bold font-heading text-white">Operator Verification</h2>
                        <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">Acquire verified credentials badge</p>
                      </div>
                      <div className="h-px bg-slate-800/80" />
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 text-center space-y-3">
                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-emerald-400 font-bold tracking-wide">You are fully verified!</p>
                        <p className="text-xs text-slate-400 font-sans">
                          Your credentials have been approved. You now have the verified badge and higher matching priority.
                        </p>
                      </div>
                    </>
                  )}

                  {/* DIRECT TUITION REQUESTS SECTION */}
                  {(() => {
                    const directRequests = (tutorJobs || []).filter((job: any) => job.status === "REQUESTED");
                    const activeAssignments = (tutorJobs || []).filter((job: any) => job.status !== "REQUESTED");

                    return (
                      <>
                        <div className="mt-8 border-t border-slate-800/80 pt-8 space-y-6">
                          <div>
                            <h2 className="text-xl font-bold font-heading text-white">Direct Tuition Requests</h2>
                            <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">Proposals sent to you directly by parents</p>
                          </div>
                          <div className="h-px bg-slate-800/80" />

                          {(!directRequests || directRequests.length === 0) ? (
                            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 text-center">
                              <p className="text-xs text-slate-500 font-mono italic">No direct tuition requests found.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {directRequests.map((job: any) => (
                                <div key={job.id} className="bg-slate-950/60 border border-slate-850 p-4.5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-extrabold">
                                      Direct Request
                                    </span>
                                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-md uppercase font-extrabold tracking-wider border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                      Pending Action
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Tuition Code</span>
                                    <span className="text-xs text-slate-200 font-bold block">TCT-{String(job.jobSeq && job.jobSeq > 0 ? job.jobSeq : 1).padStart(3, '0')}</span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono py-1">
                                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850 text-left">
                                      <span className="text-slate-500 block text-[8px] uppercase font-bold">Class</span>
                                      <span className="text-white font-bold">{job.classLevel}</span>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850 text-left">
                                      <span className="text-slate-500 block text-[8px] uppercase font-bold">Student Gender</span>
                                      <span className="text-white font-bold">{job.studentGender}</span>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850 text-left">
                                      <span className="text-slate-500 block text-[8px] uppercase font-bold">Subject</span>
                                      <span className="text-white font-bold truncate block">{job.subject}</span>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850 text-left">
                                      <span className="text-slate-500 block text-[8px] uppercase font-bold">Duration</span>
                                      <span className="text-white font-bold truncate block">{job.duration}</span>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850 text-left col-span-2">
                                      <span className="text-slate-500 block text-[8px] uppercase font-bold">Time Preference</span>
                                      <span className="text-white font-bold truncate block">{job.preferableTime}</span>
                                    </div>
                                  </div>

                                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 text-[10px] text-amber-400 font-mono text-center">
                                    ⚠️ To know full details, please contact TutorHire.
                                  </div>

                                  <button
                                    onClick={() => setRequestModalJob(job)}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs font-sans transition duration-200 cursor-pointer border-none flex items-center justify-center"
                                  >
                                    Accept Request
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ASSIGNED TUITION JOBS & SECURE MATCH PAYMENTS FOR TUTORS */}
                        <div className="mt-8 border-t border-slate-800/80 pt-8 space-y-6">
                          <div>
                            <h2 className="text-xl font-bold font-heading text-white">Assigned Tuition Jobs</h2>
                            <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">Tuition assignments requiring match payments or active details</p>
                          </div>
                          <div className="h-px bg-slate-800/80" />

                          {(!activeAssignments || activeAssignments.length === 0) ? (
                            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 text-center space-y-2">
                              <p className="text-xs text-slate-500 font-mono italic">No active tuition job assignments found.</p>
                              <p className="text-[11px] text-slate-400 font-sans">Apply to open tuition job markers directly on the map to get assigned!</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {activeAssignments.map((job: any) => (
                          <div key={job.id} className="bg-slate-950/60 border border-slate-850 p-4.5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/20 font-extrabold">
                                Job Assignment
                              </span>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md uppercase font-extrabold tracking-wider border ${
                                job.commissionPaid
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}>
                                {job.commissionPaid ? "Active Match" : "Commission Pending"}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Tuition Title</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-mono font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded shrink-0">
                                  TCT-{String(job.jobSeq && job.jobSeq > 0 ? job.jobSeq : 1).padStart(3, '0')}
                                </span>
                                <span className="text-xs text-slate-200 font-bold block text-left truncate">{job.title}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono py-1">
                              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850 text-left">
                                <span className="text-slate-500 block text-[8px] uppercase font-bold">Salary</span>
                                <span className="text-white font-bold">{job.salary} BDT</span>
                              </div>
                              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850 text-left">
                                <span className="text-slate-500 block text-[8px] uppercase font-bold">Commission (10%)</span>
                                <span className="text-amber-400 font-bold">৳{job.commissionAmount || Math.ceil(job.salary * 0.10)}</span>
                              </div>
                            </div>

                            <div className="space-y-1 pt-1.5 border-t border-slate-900">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold text-left">Parent Contact & Details</span>
                              {job.commissionPaid ? (
                                <div className="space-y-2">
                                  <div className="bg-slate-900/40 p-2.5 rounded-xl text-xs space-y-1 text-slate-300 font-sans text-left">
                                    <p><span className="text-slate-500 font-mono text-[10px]">Name:</span> {job.parent.name}</p>
                                    <p><span className="text-slate-500 font-mono text-[10px]">Phone:</span> {job.parent.phone || "Not specified"}</p>
                                    <p><span className="text-slate-500 font-mono text-[10px]">Email:</span> {job.parent.email}</p>
                                    <p className="text-[9px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                                      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                      </svg>
                                      Commission paid — Full details unlocked!
                                    </p>
                                  </div>
                                  {/* Refund request section — only within 24hrs */}
                                  {job.payment && !job.payment.refundStatus && (() => {
                                    const paymentTime = new Date(job.payment.createdAt).getTime();
                                    const hoursElapsed = (Date.now() - paymentTime) / (1000 * 60 * 60);
                                    return hoursElapsed <= 24;
                                  })() && (
                                    <div className="bg-red-500/5 border border-red-500/10 p-2.5 rounded-xl space-y-2">
                                      <span className="text-[9px] font-mono text-red-400 uppercase tracking-wider block font-bold">Request Refund (within 24hrs)</span>
                                      <input
                                        type="text"
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        placeholder="Reason for refund..."
                                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-red-500"
                                      />
                                      <button
                                        onClick={() => handleRequestRefund(job.id)}
                                        disabled={requestingRefundJobId === job.id}
                                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition disabled:opacity-50"
                                      >
                                        {requestingRefundJobId === job.id ? "Submitting..." : "Request Full Refund"}
                                      </button>
                                    </div>
                                  )}
                                  {job.payment?.refundStatus === "REQUESTED" && (
                                    <div className="bg-yellow-500/5 border border-yellow-500/10 p-2 rounded-xl text-[10px] font-mono text-yellow-400 text-center">
                                      ⏳ Refund request pending admin review
                                    </div>
                                  )}
                                  {job.payment?.refundStatus === "APPROVED" && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-xl text-[10px] font-mono text-emerald-400 text-center">
                                      ✓ Refund approved
                                    </div>
                                  )}
                                  {job.payment?.refundStatus === "REJECTED" && (
                                    <div className="bg-red-500/5 border border-red-500/10 p-2 rounded-xl text-[10px] font-mono text-red-400 text-center">
                                      ✗ Refund request rejected
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl text-[10px] font-mono text-amber-500 leading-normal text-left">
                                    Pay the 10% commission fee (৳{job.commissionAmount || Math.ceil(job.salary * 0.10)}) via bKash/Nagad to unlock parent contact details and exact location.
                                  </div>
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={commissionTrxId}
                                      onChange={(e) => setCommissionTrxId(e.target.value)}
                                      placeholder="Enter bKash/Nagad TrxID..."
                                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                    />
                                    <button
                                      onClick={() => handlePayCommission(job.id)}
                                      disabled={payingCommissionJobId === job.id}
                                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-4 rounded-xl text-xs transition duration-200 cursor-pointer border-none flex items-center justify-center disabled:opacity-50"
                                    >
                                      {payingCommissionJobId === job.id ? "Processing..." : `Pay ৳${job.commissionAmount || Math.ceil(job.salary * 0.10)} Commission`}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Student Progress Tracker */}
                            {job.status === "ASSIGNED" && job.commissionPaid && (
                              <div className="border-t border-slate-800/60 pt-3 mt-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">📊 Student Progress</span>
                                </div>
                                <ProgressTracker role="TUTOR" jobId={job.id} jobTitle={job.title} jobSubject={job.subject} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </>
                  );
                  })()}


                  {/* DYNAMIC EDUCATOR RATING SYSTEM PANEL */}
                  {hasConfirmedTuition && (
                    <div className="mt-8 border-t border-slate-800/80 pt-8 space-y-6">
                      <div>
                        <h2 className="text-xl font-bold font-heading text-white">Educator Performance & Ratings</h2>
                        <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">Telemetry from verified parent reviews</p>
                      </div>
                      <div className="h-px bg-slate-800/80" />

                      <div className="glass-card bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Average Rating Score</span>
                          <span className="text-2xl font-extrabold text-white mt-1 block flex items-center gap-1.5 font-mono">
                            ⭐ {averageRating} <span className="text-xs font-normal text-slate-500 font-mono">/ 5.0</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Reviews</span>
                          <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">
                            {reviews.length} Feedbacks
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Recent Parent Feedback</span>
                        {reviews.length === 0 ? (
                          <p className="text-xs text-slate-500 font-mono italic">No reviews submitted yet.</p>
                        ) : (
                          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                            {reviews.map((r: any) => (
                              <div key={r.id} className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white">{r.author?.name || "Parent"}</span>
                                  <span className="text-xs text-emerald-400 font-bold font-mono">★ {r.rating}</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed font-sans italic">
                                  "{r.comment || "No comment left."}"
                                </p>
                                <span className="text-[9px] text-slate-600 font-mono block">
                                  {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // PARENT INTERFACE
                <>
                  <div>
                    <h2 className="text-xl font-bold font-heading text-white">Post a Tuition</h2>
                    <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">Create a new tuition listing to find a tutor</p>
                  </div>
                  <div className="h-px bg-slate-800/80" />

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formEl = e.currentTarget;
                      setIsSubmittingJob(true);
                      const formData = new FormData(formEl);
                      const data = {
                        title: formData.get("title"),
                        subject: formData.get("subject"),
                        classLevel: formData.get("classLevel"),
                        salary: formData.get("salary"),
                        tutorRequirement: formData.get("tutorRequirement"),
                        description: formData.get("description"),
                        latitude: 23.8103,
                        longitude: 90.4125,
                      };

                      const res = await fetch("/api/jobs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                      });

                      setIsSubmittingJob(false);
                      if (res.ok) {
                        alert("✓ Tuition job posted successfully!");
                        formEl.reset();
                        // Refresh my listings
                        const r = await fetch("/api/jobs?mine=true");
                        if (r.ok) setMyJobs(await r.json());
                      } else {
                        alert("Failed to post tuition job.");
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Tuition Title</label>
                        <input
                          type="text"
                          name="title"
                          required
                          placeholder="e.g. Edexcel Maths Tutor Required"
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Subject(s)</label>
                        <input
                          type="text"
                          name="subject"
                          required
                          placeholder="e.g. Mathematics, Physics"
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Student Class</label>
                        <select
                          name="classLevel"
                          required
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200 cursor-pointer"
                        >
                          <option value="" disabled>-- Select Class --</option>
                          <option value="Play">Play</option>
                          <option value="Nursery">Nursery</option>
                          <option value="KG">Kindergarten (KG)</option>
                          <option value="Class 1">Class 1</option>
                          <option value="Class 2">Class 2</option>
                          <option value="Class 3">Class 3</option>
                          <option value="Class 4">Class 4</option>
                          <option value="Class 5">Class 5</option>
                          <option value="Class 6">Class 6</option>
                          <option value="Class 7">Class 7</option>
                          <option value="Class 8">Class 8</option>
                          <option value="Class 9">Class 9</option>
                          <option value="Class 10 (SSC)">Class 10 (SSC)</option>
                          <option value="Class 11 (HSC 1st Year)">Class 11 (HSC 1st Year)</option>
                          <option value="Class 12 (HSC 2nd Year)">Class 12 (HSC 2nd Year)</option>
                          <option value="O-Level">O-Level</option>
                          <option value="A-Level">A-Level</option>
                          <option value="Admission Test">Admission Test</option>
                          <option value="University">University</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Salary (BDT / Month)</label>
                        <input
                          type="number"
                          name="salary"
                          required
                          placeholder="e.g. 10000"
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Tutor Varsity/Dept Requirement</label>
                      <input
                        type="text"
                        name="tutorRequirement"
                        required
                        placeholder="e.g. Public Varsity Only, CSE Department, BUET/DU Students Only"
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Detailed Description</label>
                      <textarea
                        name="description"
                        rows={3}
                        placeholder="e.g. Looking for a tutor who can teach Edexcel syllabus 3 days a week. Focus on calculus and algebra."
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                      />
                    </div>

                    <div className="text-[10px] text-yellow-500 font-mono flex items-center bg-yellow-500/5 border border-yellow-500/10 p-2.5 rounded-xl">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      GPS location coordinates will mock to central Bangladesh area for mapping simulation.
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingJob}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition duration-200 cursor-pointer shadow-[0_4px_12px_rgba(var(--theme-rgb),0.15)] flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isSubmittingJob ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <span>Post Tuition</span>
                      )}
                    </button>
                  </form>

                  {/* MY LISTINGS SECTION */}
                  <div className="mt-8 border-t border-slate-800/80 pt-8 space-y-6">
                    <div>
                      <h2 className="text-xl font-bold font-heading text-white">My Tuition Listings</h2>
                      <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">All tuition posts you have created</p>
                    </div>
                    <div className="h-px bg-slate-800/80" />

                    {myJobs.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm font-mono">
                        No listings yet. Post your first tuition above!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myJobs.map((job: any) => (
                          <div key={job.id} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-emerald-500/30 transition-all duration-300">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <p className="text-sm font-bold text-white leading-snug">{job.title}</p>
                                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{job.classLevel} · {job.subject}</p>
                              </div>
                              <span className={`shrink-0 text-[9px] font-mono px-2 py-0.5 rounded border font-extrabold uppercase ${
                                job.status === "OPEN" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                job.status === "ASSIGNED" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                job.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                "bg-slate-500/10 text-slate-400 border-slate-500/20"
                              }`}>{job.status === "PENDING" ? "PENDING REVIEW" : job.status}</span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                              <span className="text-emerald-400 font-bold text-sm font-mono">{job.salary?.toLocaleString()} BDT/mo</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm("Delete this listing? This cannot be undone.")) return;
                                  const res = await fetch(`/api/jobs?jobId=${job.id}`, { method: "DELETE" });
                                  if (res.ok) {
                                    setMyJobs(prev => prev.filter((j: any) => j.id !== job.id));
                                  } else {
                                    alert("Failed to delete listing.");
                                  }
                                }}
                                className="text-[10px] font-mono text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 px-2.5 py-1 rounded-lg transition cursor-pointer"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ACTIVE ASSIGNED TUTORS LEDGER FOR PARENTS */}
                  {assignedTutors.length > 0 && (
                    <div className="mt-8 border-t border-slate-800/80 pt-8 space-y-6">
                      <div>
                        <h2 className="text-xl font-bold font-heading text-white">Matched Roster Tutors</h2>
                        <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">Assigned educators for your active tuition listings</p>
                      </div>
                      <div className="h-px bg-slate-800/80" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignedTutors.map((t: any) => (
                          <div key={t.id + '-' + (t.jobId || '')} className="bg-slate-950/60 border border-slate-850 p-4.5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-extrabold">
                                TC-{String(t.tutorSeq).padStart(3, '0')}
                              </span>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md uppercase font-extrabold tracking-wider border ${
                                t.commissionPaid
                                  ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                                  : "bg-amber-500/5 text-amber-400 border-amber-500/10"
                              }`}>
                                {t.commissionPaid ? "Full Details Unlocked" : "Pending Commission"}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Matching Tuition Job</span>
                              <span className="text-xs text-slate-200 font-bold block">{t.jobTitle}</span>
                            </div>

                            {/* Always visible: Name */}
                            <div className="space-y-1 pt-1.5 border-t border-slate-900">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Tutor Name</span>
                              <p className="text-xs text-white leading-relaxed font-sans font-semibold">
                                {t.name}
                              </p>
                            </div>

                            {/* Always visible: Education */}
                            <div className="space-y-1 pt-1.5 border-t border-slate-900">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">University / Education</span>
                              <p className="text-xs text-emerald-300 leading-relaxed font-sans font-semibold">
                                {t.education}
                              </p>
                            </div>

                            <div className="space-y-1 pt-1.5 border-t border-slate-900">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Subjects</span>
                              <p className="text-xs text-emerald-400 leading-relaxed font-sans font-semibold">
                                {t.subject}
                              </p>
                            </div>

                            <div className="space-y-1 pt-1.5 border-t border-slate-900">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Tutor Bio</span>
                              <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                                &quot;{t.bio}&quot;
                              </p>
                            </div>

                            {/* Contact details — only after commission */}
                            {t.commissionPaid ? (
                              <div className="space-y-1 pt-1.5 border-t border-slate-900">
                                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Contact Details</span>
                                <div className="bg-slate-900/40 p-2.5 rounded-xl text-xs space-y-1 text-slate-300 font-sans text-left">
                                  <p><span className="text-slate-500 font-mono text-[10px]">Phone:</span> {t.phone}</p>
                                  <p><span className="text-slate-500 font-mono text-[10px]">Email:</span> {t.email}</p>
                                  <p className="text-[9px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Commission paid — Full contact unlocked
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl text-[10px] font-mono text-amber-500 leading-normal text-center">
                                📞 Phone & email will be visible once the tutor pays the ৳{t.commissionAmount || '—'} platform commission fee.
                              </div>
                            )}

                            {/* Student Progress Tracker for Parent */}
                            {t.commissionPaid && t.jobId && (
                              <div className="border-t border-slate-800/60 pt-3 mt-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">📊 Student Progress</span>
                                </div>
                                <ProgressTracker role="PARENT" jobId={t.jobId} jobTitle={t.jobTitle} jobSubject={t.subject} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBMIT REVIEW SECTION FOR PARENTS */}
                  <div className="mt-8 border-t border-slate-800/80 pt-8 space-y-6">
                    <div>
                      <h2 className="text-xl font-bold font-heading text-white">Rate System Educators</h2>
                      <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">Leave ratings feedback for active tutors</p>
                    </div>
                    <div className="h-px bg-slate-800/80" />

                    {hasAssignedTutor ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const formEl = e.currentTarget;
                          setIsSubmittingReview(true);
                          const formData = new FormData(formEl);
                          const data = {
                            targetId: formData.get("tutorId"),
                            rating: formData.get("rating"),
                            comment: formData.get("comment"),
                          };

                          const res = await fetch("/api/reviews", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(data),
                          });

                          setIsSubmittingReview(false);
                          if (res.ok) {
                            alert("✓ Review feedback submitted successfully!");
                            formEl.reset();
                          } else {
                            alert("Failed to post review.");
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Select Assigned Tutor</label>
                            <select
                              name="tutorId"
                              required
                              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                            >
                              {assignedTutors.map((t: any) => (
                                <option key={t.id} value={t.id} className="bg-slate-950 text-slate-100">
                                  TC-{String(t.tutorSeq).padStart(3, '0')} ({t.jobTitle})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Score Rating (1-5)</label>
                            <input
                              type="number"
                              name="rating"
                              min="1"
                              max="5"
                              required
                              placeholder="5"
                              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Quality Reviews Feedback</label>
                          <textarea
                            name="comment"
                            rows={2}
                            placeholder="e.g. Excellent math tutor. Prompt, patient, and highly knowledgeable."
                            className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition duration-200 cursor-pointer shadow-[0_4px_12px_rgba(var(--theme-rgb),0.15)] flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          {isSubmittingReview ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                              <span>Submitting review...</span>
                            </>
                          ) : (
                            <span>Submit Review Feedback</span>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 text-center space-y-3">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-slate-950 border border-slate-800 text-slate-500 shadow-inner">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-slate-300">Ratings System Locked</h3>
                          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-sans">
                            The rating & feedback console will automatically open once a verified tutor has been assigned to one of your active tuition listings.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Dynamic Pay Later Coordination Modal */}
      {payLaterJob && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-center space-y-6 transform scale-100 transition-all duration-300">
            {/* Decorative hotline icon header */}
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(var(--theme-rgb),0.15)]">
              <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-heading font-extrabold text-white">Pay Later Coordination</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                To activate the match coordinates for **{payLaterJob.title}** and settle the commission after matching, please contact the TutorHire Hotline.
              </p>
            </div>

            {/* Hotline information box */}
            <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl space-y-2 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Official Hotline</span>
              <a href="tel:09696847847" className="text-2xl font-heading font-black text-emerald-400 block hover:underline hover:text-emerald-300 transition duration-200">
                096-96-847-847
              </a>
              <span className="text-[9px] text-slate-500 block font-mono">Available 24/7 for swift activation</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <a 
                href="tel:09696847847"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 cursor-pointer shadow-md flex items-center justify-center space-x-1.5 border-none h-10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Call Support</span>
              </a>
              <button 
                onClick={() => setPayLaterJob(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 cursor-pointer shadow-md flex items-center justify-center border-none h-10"
              >
                <span>Close Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Premium Platform Alert Custom Modal Popup */}
      <AnimatePresence>
        {popupOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 text-center relative"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400">
                {popupType === "success" ? (
                  <svg className="h-7 w-7 text-emerald-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : popupType === "error" ? (
                  <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              <div className="space-y-2">
                <h3 className={`text-lg font-extrabold font-heading ${popupType === "success" ? "text-emerald-400" : popupType === "error" ? "text-red-400" : "text-white"}`}>
                  {popupType === "success" ? "Success Notification" : popupType === "error" ? "Security & Validation Flag" : "Platform Alert"}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans px-2">
                  {popupMessage}
                </p>
              </div>

              <button
                onClick={() => setPopupOpen(false)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-3 rounded-xl transition duration-200 cursor-pointer text-xs font-mono uppercase tracking-wider border-none shadow-[0_4px_12px_rgba(var(--theme-rgb),0.15)]"
              >
                Acknowledge & Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accept Direct Request double-branching Modal */}
      {requestModalJob && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold font-heading text-white">Accept Tuition Request</h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans px-2">
                Accept assignment for Tuition Code <strong className="text-emerald-400 font-mono">TCT-{String(requestModalJob.jobSeq).padStart(3, '0')}</strong>. After accepting, you will need to pay a <strong className="text-amber-400">10% commission fee (৳{requestModalJob.commissionAmount || Math.ceil(requestModalJob.salary * 0.10)})</strong> to unlock the parent&apos;s full contact details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-2">
              <button
                disabled={isAccepting}
                onClick={() => handleAcceptRequest(requestModalJob.id)}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs transition duration-200 cursor-pointer border-none shadow-[0_4px_12px_rgba(var(--theme-rgb),0.15)] flex items-center justify-center"
              >
                {isAccepting ? "Accepting..." : "Accept Request"}
              </button>
            </div>

            <button
              onClick={() => setRequestModalJob(null)}
              className="w-full bg-slate-950/60 hover:bg-slate-950 border border-slate-850 text-slate-400 py-2.5 rounded-xl transition duration-200 cursor-pointer text-[10px] font-mono uppercase tracking-wider block"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pay Later Helpline Info Popup Modal */}
      {helplineModalJob && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <svg className="h-7 w-7 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold font-heading text-white">Call Helpline</h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans px-2">
                To take this tuition, note your Tuition ID: <strong className="text-indigo-400 font-mono">TCT-{String(helplineModalJob.jobSeq).padStart(3, '0')}</strong> and call our helpline.
              </p>
            </div>

            <button
              onClick={() => setHelplineModalJob(null)}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold py-3 rounded-xl transition duration-200 cursor-pointer text-xs font-mono uppercase tracking-wider border-none shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
