"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { detectFaceInImage } from "@/lib/faceDetection";
import { fetchApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

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

export default function Register() {
  const router = useRouter();
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    role: "PARENT", // PARENT or TUTOR
    phone: "",
    address: "",
    education: "",
    bio: "",
    latitude: 23.8103,
    longitude: 90.4125,
    actualLatitude: undefined as number | undefined,
    actualLongitude: undefined as number | undefined,
    gender: "",
    preferable_time: "",
  });
  const [nidImageUrl, setNidImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "scanning" | "done" | "error">("idle");
  const [fileName, setFileName] = useState("");

  const [universityIdImageUrl, setUniversityIdImageUrl] = useState("");
  const [uploadingStudentId, setUploadingStudentId] = useState(false);
  const [uploadStatusStudentId, setUploadStatusStudentId] = useState<"idle" | "uploading" | "scanning" | "done" | "error">("idle");
  const [fileNameStudentId, setFileNameStudentId] = useState("");

  const [selfieImageUrl, setSelfieImageUrl] = useState("");
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadStatusSelfie, setUploadStatusSelfie] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [fileNameSelfie, setFileNameSelfie] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [educationType, setEducationType] = useState("select"); // "select" or "custom"
  const [customEducation, setCustomEducation] = useState("");

  const validateImageContent = async (file: File, type: "nid" | "idcard"): Promise<boolean> => {
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const result = await Tesseract.recognize(file, "eng");
      const text = result.data.text.toLowerCase();
      console.log("OCR scan text outcome:", text);

      if (type === "nid") {
        const isStudentIdInstead = /\b(student|university|college|school|semester|institute)\b/i.test(text);
        const isNid = /\b(national id|national identity|government|republic|bangladesh)\b/i.test(text);
        
        // Only reject if it clearly looks like a Student ID and has no NID markers
        if (isStudentIdInstead && !isNid) {
          console.log("Rejected NID upload: Detected Student ID markers instead.");
          return false;
        }
        return true; // Lenient pass for bad OCR
      } else {
        const isNidInstead = /\b(national id|national identity|government|republic)\b/i.test(text) || (text.includes("birth") && text.includes("certificate"));
        const isStudentId = /\b(student|university|college|school|institute|department)\b/i.test(text);
        
        // Only reject if it clearly looks like an NID/Birth Cert and has no Student ID markers
        if (isNidInstead && !isStudentId) {
          console.log("Rejected Student ID upload: Detected NID/Govt markers instead.");
          return false;
        }
        return true; // Lenient pass for bad OCR
      }
    } catch (err) {
      console.error("OCR validation crashed, bypassing:", err);
      return true; // Bypass to not block users on engine failures
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    
    setUploadStatus("scanning");
    setUploading(true);
    setError("");

    try {
      const isAuthentic = await validateImageContent(file, "nid");
      if (!isAuthentic) {
        setUploadStatus("error");
        setError("Invalid Document Scan: The uploaded image does not appear to be a valid National ID Card (NID). Please upload a clear photo of your NID card to verify your tutor account.");
        setUploading(false);
        return;
      }
      
      setUploadStatus("uploading");
      await uploadNid(file);
    } catch (err) {
      console.error("NID scanning error:", err);
      setUploadStatus("error");
      setError("Failed to validate document scan. Please try again.");
      setUploading(false);
    }
  };

  const uploadNid = async (file: File) => {
    setError("");

    try {
      // Note: FileUploadController expects multipart form data with name 'file'
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchApi(`/upload`, {
        method: "POST",
        body: formData,
      });

      setNidImageUrl(response.url);
      setUploadStatus("done");
    } catch (err) {
      console.error("NID_UPLOAD_ERROR", err);
      setUploadStatus("error");
      setError("Failed to upload NID/ID image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleStudentIdFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileNameStudentId(file.name);
    
    setUploadStatusStudentId("scanning");
    setUploadingStudentId(true);
    setError("");

    try {
      const isAuthentic = await validateImageContent(file, "idcard");
      if (!isAuthentic) {
        setUploadStatusStudentId("error");
        setError("Invalid Document Scan: The uploaded image does not appear to be a valid Student or Academic ID Card. Please upload a clear photo of your actual student ID.");
        setUploadingStudentId(false);
        return;
      }

      setUploadStatusStudentId("uploading");
      await uploadStudentId(file);
    } catch (err) {
      console.error("Student ID scanning error:", err);
      setUploadStatusStudentId("error");
      setError("Failed to validate student ID scan. Please try again.");
      setUploadingStudentId(false);
    }
  };

  const uploadStudentId = async (file: File) => {
    setError("");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchApi(`/upload`, {
        method: "POST",
        body: formData,
      });

      setUniversityIdImageUrl(response.url);
      setUploadStatusStudentId("done");
    } catch (err) {
      console.error("STUDENT_ID_UPLOAD_ERROR", err);
      setUploadStatusStudentId("error");
      setError("Failed to upload Student ID image. Please try again.");
    } finally {
      setUploadingStudentId(false);
    }
  };

  const handleSelfieFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileNameSelfie(file.name);
    
    setUploadStatusSelfie("uploading");
    setUploadingSelfie(true);
    setError("");

    try {
      // 1. Quick OCR Check to catch ID Cards being uploaded as selfies
      const Tesseract = (await import("tesseract.js")).default;
      const result = await Tesseract.recognize(file, "eng");
      const text = result.data.text.toLowerCase();
      
      const isDocument = /\b(national id|identity|student|university|college|school|republic|bangladesh|government|institute|birth certificate)\b/i.test(text);
      
      if (isDocument) {
        setUploadStatusSelfie("error");
        setError("Invalid Profile Picture: Please upload a clear photo of your face, not an ID card or document.");
        setUploadingSelfie(false);
        return;
      }

      // 2. Face Detection
      const isRealHuman = await detectFaceInImage(file);
      if (!isRealHuman) {
        setUploadStatusSelfie("error");
        setError("Invalid Profile Picture: No clear human face detected. Please upload a portrait photo of yourself.");
        setUploadingSelfie(false);
        return;
      }
      
      await uploadSelfie(file);
    } catch (err) {
      console.error("Selfie upload error:", err);
      setUploadStatusSelfie("error");
      setError("Failed to upload Tutor Picture. Please try again.");
      setUploadingSelfie(false);
    }
  };

  const uploadSelfie = async (file: File) => {
    setError("");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchApi(`/upload`, {
        method: "POST",
        body: formData,
      });

      setSelfieImageUrl(response.url);
      setUploadStatusSelfie("done");
    } catch (err) {
      console.error("SELFIE_UPLOAD_ERROR", err);
      setUploadStatusSelfie("error");
      setError("Failed to upload Tutor Picture. Please try again.");
    } finally {
      setUploadingSelfie(false);
    }
  };

  const registerUser = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!data.phone || !data.address) {
      setError("Please fill out your phone number and address coordinates.");
      setLoading(false);
      return;
    }

    if (data.role === "TUTOR") {
      if (!data.education || !data.bio) {
        setError("Tutors must provide their educational qualification and active bio.");
        setLoading(false);
        return;
      }
      if (!data.gender || (data.gender !== "Male" && data.gender !== "Female")) {
        setError("Tutors must specify gender (Male or Female).");
        setLoading(false);
        return;
      }
      if (!data.preferable_time) {
        setError("Tutors must specify preferable tuition time.");
        setLoading(false);
        return;
      }
      if (!nidImageUrl || !universityIdImageUrl || !selfieImageUrl) {
        setError("Please upload your National ID, Student ID, and Tutor Picture to verify your tutor account.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      ...data,
      nidImageUrl: data.role === "TUTOR" ? nidImageUrl : undefined,
      universityIdImageUrl: data.role === "TUTOR" ? universityIdImageUrl : undefined,
      selfieImageUrl: data.role === "TUTOR" ? selfieImageUrl : undefined,
    };

    try {
      await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setLoading(false);
      router.push("/login");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Registration failed. Please check your inputs and try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:py-16 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Blob */}
      <div className="hidden md:block absolute top-1/4 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-xl p-8 bg-slate-900/60 border border-slate-800 rounded-3xl shadow-2xl relative z-10 backdrop-blur-xl space-y-6"
      >
        <div className="text-center space-y-2">
          {/* Logo Badge */}
          <Link href="/" className="inline-block">
            <div className="text-emerald-400 font-mono text-xs uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit mx-auto mb-2 shadow-[0_0_10px_rgba(var(--theme-rgb),0.1)]">
              TutorHire
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold font-heading text-white tracking-tight">
            Create Account
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-sans">
            Create a new account on our platform
          </p>
        </div>

        {/* Form Container */}
        <form className="space-y-5" onSubmit={registerUser}>
          
          {/* Static Primary Info (Always Required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Operator Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                placeholder="Naimur Rahman"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Email Address</label>
              <input
                type="email"
                autoComplete="email"
                required
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                placeholder="hello@tutorhire.com"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Secure Password</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                placeholder="••••••••••••"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">System Operator Role</label>
              <select
                value={data.role}
                onChange={(e) => {
                  setData({ ...data, role: e.target.value });
                  setError("");
                }}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 cursor-pointer"
              >
                <option value="PARENT">Guardian / Parent Profile</option>
                <option value="TUTOR">Educator / Tutor Profile</option>
              </select>
            </div>
          </div>

          {/* Dynamic Role-Based Inputs */}
          <div className="h-px bg-slate-800 my-2" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Contact Phone Number</label>
              <input
                type="text"
                required
                placeholder="+880 17XXXXXXXX"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Address / Area Coordinates</label>
              <input
                type="text"
                required
                placeholder="e.g. Block D, Lalmatia, Bangladesh"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                value={data.address}
                onChange={(e) => setData({ ...data, address: e.target.value })}
              />
            </div>
          </div>

          {/* Map Geolocation Selector */}
          <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-800 rounded-2xl">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Coordinates Resolution Map
            </label>
            <MapPicker
              initialLat={data.latitude}
              initialLng={data.longitude}
              onChange={({ lat, lng, actualLat, actualLng }) => {
                setData((prev) => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                  actualLatitude: actualLat !== undefined ? actualLat : prev.actualLatitude,
                  actualLongitude: actualLng !== undefined ? actualLng : prev.actualLongitude,
                }));
              }}
            />
          </div>

          <AnimatePresence mode="wait">
            {data.role === "TUTOR" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 overflow-hidden pt-2"
              >

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Highest Education Level</label>
                    <select
                      value={educationType === "custom" ? "Other" : data.education}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Other") {
                          setEducationType("custom");
                          setData({ ...data, education: customEducation || "" });
                        } else {
                          setEducationType("select");
                          setData({ ...data, education: val });
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
                        required={data.role === "TUTOR"}
                        value={customEducation}
                        onChange={(e) => {
                          setCustomEducation(e.target.value);
                          setData({ ...data, education: e.target.value });
                        }}
                        placeholder="Type custom education (e.g. B.Sc in EEE from BUET)"
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 mt-1.5 animate-fadeIn"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Gender</label>
                    <select
                      value={data.gender}
                      required={data.role === "TUTOR"}
                      onChange={(e) => setData({ ...data, gender: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 cursor-pointer"
                    >
                      <option value="" disabled className="bg-slate-950 text-slate-500">-- Select Gender --</option>
                      <option value="Male" className="bg-slate-950 text-slate-100">Male</option>
                      <option value="Female" className="bg-slate-950 text-slate-100">Female</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Preferable Time</label>
                    <select
                      value={data.preferable_time}
                      required={data.role === "TUTOR"}
                      onChange={(e) => setData({ ...data, preferable_time: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 cursor-pointer"
                    >
                      <option value="" disabled className="bg-slate-950 text-slate-500">-- Select Preferable Time --</option>
                      <option value="Available All Day" className="bg-slate-950 text-slate-100">Available All Day</option>
                      <option value="Morning (8:00 AM - 12:00 PM)" className="bg-slate-950 text-slate-100">Morning (8:00 AM - 12:00 PM)</option>
                      <option value="Afternoon (12:00 PM - 4:00 PM)" className="bg-slate-950 text-slate-100">Afternoon (12:00 PM - 4:00 PM)</option>
                      <option value="Evening (4:00 PM - 8:00 PM)" className="bg-slate-950 text-slate-100">Evening (4:00 PM - 8:00 PM)</option>
                      <option value="Night (8:00 PM - 11:00 PM)" className="bg-slate-950 text-slate-100">Night (8:00 PM - 11:00 PM)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Specialization / Short Bio</label>
                    <input
                      type="text"
                      required={data.role === "TUTOR"}
                      placeholder="e.g. 3+ years experience teaching O-Level Physics"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                      value={data.bio}
                      onChange={(e) => setData({ ...data, bio: e.target.value })}
                    />
                  </div>
                </div>

                {/* Tutor Documents Upload Zone */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* NID Upload */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      National ID (NID) <span className="text-red-400">*</span>
                    </label>
                    
                    <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 text-center bg-slate-950/40 transition-colors duration-200 relative group flex flex-col items-center justify-center min-h-[140px] cursor-pointer">
                      <input
                        type="file"
                        required={data.role === "TUTOR" && !nidImageUrl}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                      onClick={(e) => { e.currentTarget.value = ""; }} />

                      {uploadStatus === "idle" && (
                        <div className="space-y-2 pointer-events-none flex flex-col items-center">
                          <svg className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <p className="text-xs text-slate-400">
                            Drop or <span className="text-emerald-400 font-semibold">browse NID</span>
                          </p>
                        </div>
                      )}

                      {uploadStatus === "scanning" && (
                        <div className="space-y-3 pointer-events-none flex flex-col items-center">
                          <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                          <p className="text-[10px] text-indigo-400 font-mono font-bold animate-pulse">Scanning Authenticity...</p>
                        </div>
                      )}

                      {uploadStatus === "uploading" && (
                        <div className="space-y-3 pointer-events-none flex flex-col items-center">
                          <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
                          <p className="text-[10px] text-slate-400 font-mono">Uploading Verified Scan...</p>
                        </div>
                      )}

                      {uploadStatus === "done" && nidImageUrl && (
                        <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden z-10 pointer-events-none">
                          <img
                            src={nidImageUrl}
                            alt="NID Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center p-3 text-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 mb-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="text-[10px] text-emerald-400 font-bold font-mono">✓ NID Uploaded</p>
                            <p className="text-[8px] text-slate-300 truncate max-w-full px-1">{fileName}</p>
                          </div>
                        </div>
                      )}

                      {uploadStatus === "error" && (
                        <div className="space-y-2 pointer-events-none flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div className="text-center space-y-0.5">
                            <p className="text-[10px] text-red-400 font-semibold font-mono">Failed</p>
                            <p className="text-[8px] text-slate-400 font-mono">Click to reupload</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Student ID Upload */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Student ID Card <span className="text-red-400">*</span>
                    </label>
                    
                    <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 text-center bg-slate-950/40 transition-colors duration-200 relative group flex flex-col items-center justify-center min-h-[140px] cursor-pointer">
                      <input
                        type="file"
                        required={data.role === "TUTOR" && !universityIdImageUrl}
                        accept="image/*"
                        onChange={handleStudentIdFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                      onClick={(e) => { e.currentTarget.value = ""; }} />

                      {uploadStatusStudentId === "idle" && (
                        <div className="space-y-2 pointer-events-none flex flex-col items-center">
                          <svg className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                          </svg>
                          <p className="text-xs text-slate-400">
                            Drop or <span className="text-emerald-400 font-semibold">browse ID</span>
                          </p>
                        </div>
                      )}

                      {uploadStatusStudentId === "scanning" && (
                        <div className="space-y-3 pointer-events-none flex flex-col items-center">
                          <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                          <p className="text-[10px] text-indigo-400 font-mono font-bold animate-pulse">Scanning Authenticity...</p>
                        </div>
                      )}

                      {uploadStatusStudentId === "uploading" && (
                        <div className="space-y-3 pointer-events-none flex flex-col items-center">
                          <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
                          <p className="text-[10px] text-slate-400 font-mono">Uploading Verified Scan...</p>
                        </div>
                      )}

                      {uploadStatusStudentId === "done" && universityIdImageUrl && (
                        <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden z-10 pointer-events-none">
                          <img
                            src={universityIdImageUrl}
                            alt="Student ID Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center p-3 text-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 mb-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="text-[10px] text-emerald-400 font-bold font-mono">✓ Student ID Uploaded</p>
                            <p className="text-[8px] text-slate-300 truncate max-w-full px-1">{fileNameStudentId}</p>
                          </div>
                        </div>
                      )}

                      {uploadStatusStudentId === "error" && (
                        <div className="space-y-2 pointer-events-none flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div className="text-center space-y-0.5">
                            <p className="text-[10px] text-red-400 font-semibold font-mono">Failed</p>
                        <p className="text-[8px] text-slate-400 font-mono">Click to reupload</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tutor Picture Upload */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Tutor Photo / Picture <span className="text-red-400">*</span>
                    </label>
                    
                    <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 text-center bg-slate-950/40 transition-colors duration-200 relative group flex flex-col items-center justify-center min-h-[140px] cursor-pointer">
                      <input
                        type="file"
                        required={data.role === "TUTOR" && !selfieImageUrl}
                        accept="image/*"
                        onChange={handleSelfieFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                      onClick={(e) => { e.currentTarget.value = ""; }} />

                      {uploadStatusSelfie === "idle" && (
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

                      {uploadStatusSelfie === "uploading" && (
                        <div className="space-y-3 pointer-events-none flex flex-col items-center">
                          <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
                          <p className="text-[10px] text-slate-400 font-mono">Uploading Picture...</p>
                        </div>
                      )}

                      {uploadStatusSelfie === "done" && selfieImageUrl && (
                        <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden z-10 pointer-events-none">
                          <img
                            src={selfieImageUrl}
                            alt="Tutor Photo Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center p-3 text-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 mb-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="text-[10px] text-emerald-400 font-bold font-mono">✓ Photo Uploaded</p>
                            <p className="text-[8px] text-slate-300 truncate max-w-full px-1">{fileNameSelfie}</p>
                          </div>
                        </div>
                      )}

                      {uploadStatusSelfie === "error" && (
                        <div className="space-y-2 pointer-events-none flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div className="text-center space-y-0.5">
                            <p className="text-[10px] text-red-400 font-semibold font-mono">Failed</p>
                        <p className="text-[8px] text-slate-400 font-mono">Click to reupload</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Removed Parent requirements to keep Guardian onboarding clean */}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 py-2.5 rounded-xl font-mono"
            >
              ⚠ {error}
            </motion.p>
          )}

          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(var(--theme-rgb),0.3)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || uploading || uploadingStudentId || uploadingSelfie}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-slate-950 bg-emerald-500 hover:bg-emerald-600 focus:outline-none transition duration-200 cursor-pointer shadow-[0_4px_12px_rgba(var(--theme-rgb),0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : (uploading || uploadingStudentId || uploadingSelfie) ? "Waiting for file upload..." : "Create Account"}
            </motion.button>
          </div>
        </form>

        <div className="text-sm text-center border-t border-slate-800/80 pt-6">
          <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
            Already registered? Sign in instead
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
