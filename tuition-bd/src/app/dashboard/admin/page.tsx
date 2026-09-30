"use client";
import { fetchApi } from "@/lib/api";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NavbarWrapper from "@/components/NavbarWrapper";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamically import Leaflet components to secure static Next.js compilation safety
const AdminLocationMismatchMap = dynamic(() => import("@/components/map/AdminLocationMismatchMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center animate-pulse">
      <span className="text-xs text-slate-500 font-mono">Loading inspection map...</span>
    </div>
  ),
});

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center animate-pulse">
      <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Initializing pick map...</span>
    </div>
  ),
});

// Haversine formula helper to audit distance discrepancies in kilometers
function getDistanceInKm(lat1: number | null, lon1: number | null, lat2: number | null, lon2: number | null) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Convert DB Sequence identifier into beautiful TC-XXX / TP-XXX visual sequences
const getVisualId = (role: string, seq: number | null) => {
  const index = seq && seq > 0 ? seq : 1;
  const prefix = role === "TUTOR" ? "TC-" : "TP-";
  return `${prefix}${String(index).padStart(3, "0")}`;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession() || { data: null, status: "unauthenticated" };
  const router = useRouter();

  // Tab switcher and basic loaders
  const [activeTab, setActiveTab] = useState<"documents" | "tutors" | "parents" | "blacklist" | "payments" | "jobs" | "confirmedJobs">("documents");
  const [pendingProfiles, setPendingProfiles] = useState<any[]>([]);
  const [editingRequirements, setEditingRequirements] = useState<Record<string, string>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [loadingAllProfiles, setLoadingAllProfiles] = useState(false);
  const [blacklisted, setBlacklisted] = useState<any[]>([]);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);
  
  const [currentPagePending, setCurrentPagePending] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [previewDocuments, setPreviewDocuments] = useState<{
    nid: string | null;
    idCard: string | null;
    selfie: string | null;
    name: string;
    profileId: string;
  } | null>(null);

  // Interaction tracking state hooks
  const [expandedMapProfileId, setExpandedMapProfileId] = useState<string | null>(null);
  const [expandedMapJobId, setExpandedMapJobId] = useState<string | null>(null);
  const [rejectionPromptProfileId, setRejectionPromptProfileId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [customRejectionSelected, setCustomRejectionSelected] = useState(false);

  // Master editor state structures
  const [editingProfile, setEditingProfile] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    education: "",
    bio: "",
    latitude: 23.8103,
    longitude: 90.4125,
    verificationStatus: "UNVERIFIED",
    rejectionReason: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState("");

  // Search parameters
  const [searchType, setSearchType] = useState<"user" | "tuition">("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [userSearchResult, setUserSearchResult] = useState<any>(null);
  const [tuitionSearchResult, setTuitionSearchResult] = useState<any>(null);

  const handleAdminSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError("");
    setUserSearchResult(null);
    setTuitionSearchResult(null);

    try {
      if (searchType === "user") {
        const data = await fetchApi(`/admin/search/user?registration_number=${encodeURIComponent(searchQuery.trim())}`);
        setUserSearchResult(data);
      } else {
        const data = await fetchApi(`/admin/search/tuition?tuition_id=${encodeURIComponent(searchQuery.trim())}`);
        setTuitionSearchResult(data);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("404")) {
        setSearchError(searchType === "user" ? "No user was found matching that registration number / details." : "No tuition post was found matching that ID.");
      } else {
        setSearchError(`An error occurred while performing ${searchType} search.`);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchError("");
    setUserSearchResult(null);
    setTuitionSearchResult(null);
  };

  const handleReFetchSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      if (searchType === "user") {
        const data = await fetchApi(`/admin/search/user?registration_number=${encodeURIComponent(searchQuery.trim())}`);
        setUserSearchResult(data);
      } else {
        const data = await fetchApi(`/admin/search/tuition?tuition_id=${encodeURIComponent(searchQuery.trim())}`);
        setTuitionSearchResult(data);
      }
    } catch (err) {
      console.error("Refetch search failed:", err);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      await fetchApi(`/payments/${paymentId}/approve`, { method: "PATCH" });
      setPayments((prev: any) =>
        prev.map((p: any) => (p.id === paymentId ? { ...p, status: "COMPLETED" } : p))
      );
      fetchPaymentsList();
    } catch (err) {
      console.error("Failed to approve payment", err);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      await fetchApi(`/payments/${paymentId}/reject`, { method: "PATCH" });
      setPayments((prev: any) =>
        prev.map((p: any) => (p.id === paymentId ? { ...p, status: "REJECTED" } : p))
      );
      fetchPaymentsList();
    } catch (err) {
      console.error("Failed to reject payment", err);
    }
  };



  // Rejection predefined options templates
  const REJECTION_TEMPLATES = [
    "Uploaded document scans are blurred, dark, or unreadable.",
    "Provided name or education level does not match uploaded identifier credentials.",
    "Device GPS geolocation coordinates deviate severely from claimed home coordinates.",
  ];

  // Route security gate calculations
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      if ((session.user as any).role !== "ADMIN") {
        router.push("/dashboard");
      } else if (window.location.pathname !== "/admin") {
        router.replace("/admin");
      }
    }
  }, [status, session, router]);

  // Load document verification queue
  const fetchPendingVerifications = () => {
    setLoadingProfiles(true);
    fetchApi(`/admin/verify?t=${Date.now()}`)
      .then((data) => {
        setPendingProfiles(Array.isArray(data) ? data.filter((p: any) => p.user?.role !== "PARENT") : []);
        setLoadingProfiles(false);
      })
      .catch((err) => {
        console.error("Load Pending error:", err);
        setLoadingProfiles(false);
      });
  };

  // Load complete Parents & Tutors directories
  const fetchAllProfilesList = () => {
    setLoadingAllProfiles(true);
    fetchApi(`/admin/profiles?t=${Date.now()}`)
      .then((data) => {
        setAllProfiles(Array.isArray(data) ? data : []);
        setLoadingAllProfiles(false);
      })
      .catch((err) => {
        console.error("Load Directories error:", err);
        setLoadingAllProfiles(false);
      });
  };

  useEffect(() => {
    if (session) {
      fetchPendingVerifications();
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchAllProfilesList();
    }
  }, [session]);

  const fetchBlacklist = () => {
    setLoadingBlacklist(true);
    fetchApi(`/admin/blacklist?t=${Date.now()}`)
      .then((data) => {
        setBlacklisted(Array.isArray(data) ? data : []);
        setLoadingBlacklist(false);
      })
      .catch((err) => {
        console.error("Load Blacklist error:", err);
        setLoadingBlacklist(false);
      });
  };

  useEffect(() => {
    if (session) {
      fetchBlacklist();
    }
  }, [session]);



  const fetchJobsList = () => {
    setLoadingJobs(true);
    fetchApi(`/jobs?t=${Date.now()}`)
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoadingJobs(false);
      })
      .catch((err) => {
        console.error("Load Jobs error:", err);
        setLoadingJobs(false);
      });
  };

  useEffect(() => {
    if (session) {
      fetchJobsList();
    }
  }, [session]);

  const fetchPaymentsList = () => {
    setLoadingPayments(true);
    fetchApi(`/payments?t=${Date.now()}`)
      .then((data) => {
        setPayments(Array.isArray(data) ? data : []);
        setLoadingPayments(false);
      })
      .catch((err) => {
        console.error("Load Payments error:", err);
        setLoadingPayments(false);
      });
  };

  useEffect(() => {
    if (session) {
      fetchPaymentsList();
    }
  }, [session]);

  const handleAssignTutor = async (jobId: string, tutorId: string) => {
    if (!confirm("Are you sure you want to manually assign this tutor to this job (Pay Later term)?")) return;
    try {
      await fetchApi("/admin/jobs", {
        method: "PATCH",
        body: JSON.stringify({ jobId, action: "assign", tutorId }),
      });
      alert("✓ Tutor assigned manually successfully (Pay Later active).");
      fetchJobsList();
      handleReFetchSearch();
    } catch (err) {
      console.error("Assign tutor error:", err);
      alert("An error occurred while assigning tutor.");
    }
  };



  const handleBanUser = async (userId: string) => {
    const reason = prompt("Enter a reason for banning this user:");
    if (reason === null) return;

    if (!confirm("Are you sure you want to ban this user? Their account will be deleted and phone number blacklisted.")) return;

    try {
      await fetchApi("/admin/ban", {
        method: "POST",
        body: JSON.stringify({ userId, reason }),
      });
      alert("✓ User has been successfully banned and their number blacklisted.");
      fetchAllProfilesList();
    } catch (err) {
      console.error("Ban error:", err);
      alert("An error occurred while banning the user.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to completely remove this user? Their profile and jobs will be deleted, but they can register again later. This action cannot be undone.")) return;

    try {
      await fetchApi(`/admin/user/${userId}`, {
        method: "DELETE",
      });
      alert("✓ User has been successfully deleted.");
      fetchAllProfilesList();
    } catch (err) {
      console.error("Delete user error:", err);
      alert("An error occurred while deleting the user.");
    }
  };

  const handleUnban = async (blacklistId: string) => {
    if (!confirm("Are you sure you want to remove this number from the blacklist?")) return;
    try {
      await fetchApi(`/admin/blacklist?id=${blacklistId}`, { method: "DELETE" });
      fetchBlacklist();
    } catch (err) {
      console.error("Unban error:", err);
      alert("An error occurred while removing from blacklist.");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this tuition post? This cannot be undone.")) return;
    try {
      const res = await fetchApi(`/jobs/${jobId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("✓ Job post deleted successfully!");
        fetchAllProfilesList();
        fetchJobsList();
        handleReFetchSearch();
      } else {
        alert("Failed to delete job post.");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting job post.");
    }
  };

  const handleApproveJob = async (jobId: string, requirement: string) => {
    try {
      await fetchApi(`/jobs/${jobId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "OPEN", tutorRequirement: requirement }),
      });
      alert("✓ Tuition job approved and published live!");
      fetchAllProfilesList();
      fetchJobsList();
      handleReFetchSearch();
    } catch (err) {
      console.error(err);
      alert("Error approving job post.");
    }
  };

  const handleToggleTutorActive = async (profileId: string, isActive: boolean) => {
    try {
      await fetchApi("/admin/profiles", {
        method: "PATCH",
        body: JSON.stringify({
          profileId,
          is_active: isActive,
          ...(isActive ? { reactivationRequested: false } : {})
        }),
      });
      alert(`✓ Tutor status updated to ${isActive ? "Active" : "Inactive"}.`);
      fetchAllProfilesList();
      handleReFetchSearch();
    } catch (err) {
      console.error("Toggle active error:", err);
      alert("An error occurred while updating status.");
    }
  };

  const handleReleaseTutorDetails = async (jobId: string) => {
    if (!confirm("Are you sure you want to release this tutor's contact details to the parent?")) return;
    try {
      await fetchApi("/admin/jobs", {
        method: "PATCH",
        body: JSON.stringify({
          jobId,
          action: "release"
        }),
      });
      alert("✓ Tutor contact details released successfully!");
      fetchJobsList();
      handleReFetchSearch();
    } catch (err) {
      console.error("Release details error:", err);
      alert("An error occurred while releasing details.");
    }
  };

  // Verification Approvals and Rejections controller
  const handleVerify = async (profileId: string, verifyStatus: "VERIFIED" | "REJECTED", reason?: string) => {
    try {
      await fetchApi("/admin/verify", {
        method: "PATCH",
        body: JSON.stringify({
          profileId,
          status: verifyStatus,
          rejectionReason: verifyStatus === "REJECTED" ? reason : undefined,
        }),
      });
      setPendingProfiles((prev) => prev.filter((p) => p.id !== profileId));
      alert(`✓ Tutor account status has been marked as ${verifyStatus.toLowerCase()} successfully.`);
      setRejectionPromptProfileId(null);
      setRejectionReasonInput("");
      setCustomRejectionSelected(false);
      // Refresh directories list too if loaded
      if (activeTab === "tutors" || activeTab === "parents") {
        fetchAllProfilesList();
      }
      handleReFetchSearch();
    } catch (err) {
      console.error("Verification updates failed:", err);
      alert("An error occurred while modifying account verification.");
    }
  };

  // Modal Editing submit handler
  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setEditError("");

    try {
      await fetchApi("/admin/profiles", {
        method: "PATCH",
        body: JSON.stringify({
          profileId: editingProfile.id,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
          education: editingProfile.user.role === "TUTOR" ? editForm.education : undefined,
          bio: editingProfile.user.role === "TUTOR" ? editForm.bio : undefined,
          latitude: editForm.latitude,
          longitude: editForm.longitude,
          verificationStatus: editForm.verificationStatus,
          rejectionReason: editForm.verificationStatus === "REJECTED" ? editForm.rejectionReason : undefined,
        }),
      });
      setEditingProfile(null);
      alert("✓ Master account records synchronized and successfully updated!");
      // Refresh active views
      if (activeTab === "tutors" || activeTab === "parents") {
        fetchAllProfilesList();
      } else {
        fetchPendingVerifications();
      }
    } catch (err) {
      console.error("Save details error:", err);
      setEditError("Internal server error while transmitting modifications.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Open Edit Modal loader helper
  const handleOpenEditModal = (profile: any) => {
    setEditingProfile(profile);
    setEditForm({
      name: profile.user?.name || "",
      email: profile.user?.email || "",
      phone: profile.phone || "",
      address: profile.address || "",
      education: profile.education || "",
      bio: profile.bio || "",
      latitude: profile.latitude || 23.8103,
      longitude: profile.longitude || 90.4125,
      verificationStatus: profile.verificationStatus || "UNVERIFIED",
      rejectionReason: profile.rejectionReason || "",
    });
    setEditError("");
  };

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
        <p className="text-slate-600 dark:text-slate-400 font-mono text-xs uppercase tracking-widest">Securing Session...</p>
      </div>
    );
  }

  // Calculate quick glowing summaries
  const mismatchAlerts = allProfiles.filter((p) => {
    const d = getDistanceInKm(p.latitude, p.longitude, p.actualLatitude, p.actualLongitude);
    return d > 2.0;
  }).length;

  const renderDirectoryTab = (role: "TUTOR" | "PARENT") => {
    const filteredProfiles = allProfiles.filter((p) => p.user?.role === role);

    return (
      <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
            {role === "TUTOR" ? "Tutor Directory & Location Audits" : "Parent Directory & Location Audits"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
            {role === "TUTOR"
              ? "Track geolocations, calculate mismatch distances, and inspect tutor spatial mappings"
              : "Track parent coordinates, verify tuition areas, and oversee platform access"}
          </p>
        </div>
        <div className="h-px bg-slate-800/80" />

        {loadingAllProfiles ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Fetching active directory...</span>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="py-12 text-center bg-slate-100 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-900 rounded-xl space-y-2 animate-fadeIn">
            <span className="text-3xl">👥</span>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No {role === "TUTOR" ? "Tutors" : "Parents"} Seeded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Could not detect any {role === "TUTOR" ? "tutor" : "parent"} profile structures registered in the database.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProfiles.map((profile) => {
              const dist = getDistanceInKm(
                profile.latitude,
                profile.longitude,
                profile.actualLatitude,
                profile.actualLongitude
              );
              const isHighMismatch = dist > 2.0;

              return (
                <div
                  key={profile.id}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-4 hover:border-slate-200 dark:border-slate-800 transition-all duration-300 animate-fadeIn"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex flex-col items-center space-y-1 mt-0.5">
                        <span className="text-xs text-indigo-400 font-bold font-mono px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
                          {getVisualId(profile.user?.role || "PARENT", profile.tutorSeq)}
                        </span>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          profile.user?.role === "TUTOR"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                        }`}>
                          {profile.user?.role || "PARENT"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                          {profile.user?.name || "Unknown Operator"}
                          {profile.verificationStatus === "VERIFIED" && (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono uppercase tracking-wider font-bold">
                              ✓ Verified
                            </span>
                          )}
                          {profile.verificationStatus === "PENDING" && (
                            <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20 font-mono uppercase tracking-wider font-bold">
                              Pending
                            </span>
                          )}
                          {profile.verificationStatus === "REJECTED" && (
                            <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 font-mono uppercase tracking-wider font-bold">
                              Rejected
                            </span>
                          )}
                          {role === "TUTOR" && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wider font-bold ${
                              profile.is_active
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                              {profile.is_active ? "Active" : "Inactive"}
                            </span>
                          )}
                          {role === "TUTOR" && profile.reactivationRequested && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono uppercase tracking-wider font-bold animate-pulse">
                              ⚠️ Reactivation Requested
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                          {profile.user?.email} | 📞 {profile.phone || "No phone"}
                        </p>
                        <p className="text-xs text-slate-500 font-sans">
                          📍 Claimed: {profile.address || "No address entered"}
                        </p>
                      </div>
                    </div>

                    {/* Distance telemetry and inspect mapping */}
                    <div className="flex flex-wrap items-center gap-3">
                      {profile.latitude !== null && profile.actualLatitude !== null ? (
                        <div className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-mono text-xs border ${
                          isHighMismatch
                            ? "bg-red-500/10 border-red-500/25 text-red-400"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}>
                          <span>
                            {isHighMismatch ? "⚠️ GPS Mismatch:" : "✓ Location Mism:"}
                          </span>
                          <strong className="font-bold">{dist.toFixed(2)} km</strong>
                        </div>
                      ) : (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-mono text-xs text-slate-500">
                          GPS Unresolved
                        </div>
                      )}

                      {profile.latitude !== null && profile.actualLatitude !== null && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMapProfileId(
                              expandedMapProfileId === profile.id ? null : profile.id
                            )
                          }
                          className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-mono font-bold transition duration-200 cursor-pointer"
                        >
                          {expandedMapProfileId === profile.id ? "🗺️ Collapse Map" : "🗺️ Inspect Map"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(profile)}
                        className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl transition duration-200 cursor-pointer text-xs font-bold"
                        title="Edit Profile Details"
                      >
                        ✏️ Edit
                      </button>

                      {role === "TUTOR" && (
                        <>
                          {profile.is_active ? (
                            <button
                              type="button"
                              onClick={() => handleToggleTutorActive(profile.id, false)}
                              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-3 py-2 rounded-xl transition duration-200 cursor-pointer text-xs font-bold font-mono uppercase"
                              title="Mark Tutor Inactive"
                            >
                              Mark Inactive
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleTutorActive(profile.id, true)}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl transition duration-200 cursor-pointer text-xs font-bold font-mono uppercase animate-pulse"
                              title="Reactivate Tutor"
                            >
                              {profile.reactivationRequested ? "Approve Reactivation" : "Mark Active"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(profile.user?.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl transition duration-200 cursor-pointer text-xs font-bold font-mono uppercase"
                            title="Completely remove tutor account"
                          >
                            Completely Remove
                          </button>
                        </>
                      )}

                      {role === "PARENT" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(profile.user?.id)}
                            className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 px-3 py-2 rounded-xl transition duration-200 cursor-pointer text-xs font-bold font-mono uppercase"
                            title="Delete Parent Account"
                          >
                            Delete Account
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBanUser(profile.user?.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl transition duration-200 cursor-pointer text-xs font-bold font-mono uppercase"
                            title="Ban and Blacklist Parent Account"
                          >
                            Ban Account
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {role === "PARENT" && (
                    (() => {
                      const parentJobs = jobs.filter((j: any) => j.parent?.id === profile.user?.id);
                      if (parentJobs.length === 0) return null;
                      return (
                        <div className="p-4 bg-slate-900/30 border border-slate-200 dark:border-slate-900 rounded-2xl space-y-3 mt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">
                              Active Tuition Posts ({parentJobs.length})
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono uppercase tracking-wider text-[9px]">
                                  <th className="py-2 px-3">ID</th>
                                  <th className="py-2 px-3">Class/Subject</th>
                                  <th className="py-2 px-3">Salary</th>
                                  <th className="py-2 px-3 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {parentJobs.map((job: any) => (
                                  <React.Fragment key={job.id}>
                                    <tr className="border-b border-slate-200 dark:border-slate-900/60 hover:bg-slate-100 dark:bg-slate-900/10 transition-colors">
                                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                                        TCT-{String(job.jobSeq).padStart(3, '0')}
                                      </td>
                                      <td className="py-3 px-3 text-slate-200 font-medium">
                                        {job.classLevel} - {job.subject}
                                      </td>
                                      <td className="py-3 px-3 text-pink-400 font-mono font-bold">
                                        ৳ {job.salary}
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                          <button
                                            type="button"
                                            onClick={() => setExpandedMapJobId(expandedMapJobId === job.id ? null : job.id)}
                                            className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer text-[10px] font-bold font-sans uppercase shadow-[0_0_8px_rgba(var(--theme-rgb),0.05)]"
                                          >
                                            {expandedMapJobId === job.id ? "Hide Map" : "View Map"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteJob(job.id)}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer text-[10px] font-bold font-sans uppercase shadow-[0_0_8px_rgba(var(--theme-rgb),0.05)]"
                                          >
                                            Delete Post
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                    <AnimatePresence>
                                      {expandedMapJobId === job.id && (
                                        <motion.tr
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: "auto" }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="overflow-hidden bg-white dark:bg-slate-950/50"
                                        >
                                          <td colSpan={4} className="p-4 border-b border-slate-200 dark:border-slate-900/60">
                                            {job.latitude !== null && job.longitude !== null ? (
                                              <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-900 rounded-2xl space-y-3">
                                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                                  <span>Actual Location: {job.latitude?.toFixed(5)}, {job.longitude?.toFixed(5)}</span>
                                                  <span className="text-emerald-400 font-bold">Approx Location: {(job.approxLatitude || job.latitude)?.toFixed(5)}, {(job.approxLongitude || job.longitude)?.toFixed(5)}</span>
                                                </div>
                                                <AdminLocationMismatchMap
                                                  lat={job.latitude || 23.8103}
                                                  lng={job.longitude || 90.4125}
                                                  actualLat={job.approxLatitude || job.latitude || 23.8103}
                                                  actualLng={job.approxLongitude || job.longitude || 90.4125}
                                                  name={job.title || "Tuition Post"}
                                                />
                                              </div>
                                            ) : (
                                              <div className="text-center p-6 text-slate-500 font-mono text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                                No GPS coordinates registered for this post.
                                              </div>
                                            )}
                                          </td>
                                        </motion.tr>
                                      )}
                                    </AnimatePresence>
                                  </React.Fragment>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {/* Expandable Location Auditing Leaflet widgets */}
                  <AnimatePresence>
                    {expandedMapProfileId === profile.id &&
                      profile.latitude !== null &&
                      profile.actualLatitude !== null && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-900 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                              <span>Provided Pin: {profile.latitude.toFixed(5)}, {profile.longitude.toFixed(5)}</span>
                              <span className="text-red-400 font-bold">Physical Device GPS: {profile.actualLatitude.toFixed(5)}, {profile.actualLongitude.toFixed(5)}</span>
                            </div>
                            <AdminLocationMismatchMap
                              lat={profile.latitude}
                              lng={profile.longitude}
                              actualLat={profile.actualLatitude}
                              actualLng={profile.actualLongitude}
                              name={profile.user?.name || "Operator"}
                            />
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>

                  {/* Extra bio/education for tutors inside directories list */}
                  {profile.user?.role === "TUTOR" && (
                    <div className="bg-slate-900/20 p-3.5 border border-slate-200 dark:border-slate-900/60 rounded-xl text-xs font-sans text-slate-600 dark:text-slate-400 space-y-1.5">
                      <p>
                        <strong className="text-slate-700 dark:text-slate-300">Educator Levels:</strong> {profile.education || "Not configured"}
                      </p>
                      <p className="italic">
                        <strong className="text-slate-700 dark:text-slate-300 not-italic">Bio:</strong> "{profile.bio || "No biography loaded."}"
                      </p>
                      {(profile.nidImageUrl || profile.universityIdImageUrl || profile.selfieImageUrl) && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDocuments({
                              nid: profile.nidImageUrl,
                              idCard: profile.universityIdImageUrl,
                              selfie: profile.selfieImageUrl,
                              name: profile.user?.name || "Educator",
                              profileId: profile.id
                            })}
                            className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-850 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-850 px-2.5 py-1.5 rounded-lg font-mono uppercase font-bold tracking-wider cursor-pointer"
                          >
                            🔍 Inspect Document Scans
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-100 flex flex-col relative z-0">
      <NavbarWrapper />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full relative z-10 space-y-8">
        
        {/* Welcome Header */}
        <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-emerald-500/5 rounded-full filter blur-[60px] pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1 flex-shrink-0">
              <h1 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
                Admin Control Panel
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-mono flex items-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(var(--theme-rgb),0.8)] animate-pulse" />
                Operational Credentials Authorized: <span className="text-emerald-400 ml-1 font-bold">SYSTEM ADMINISTRATOR</span>
              </p>
            </div>
            
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono w-full">
              <div className="bg-slate-900/40 border border-slate-200 dark:border-slate-850 p-4 rounded-xl flex flex-col">
                <span className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">Verification Queue</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{pendingProfiles.length} Pending</span>
              </div>
              <div className="bg-slate-900/40 border border-slate-200 dark:border-slate-850 p-4 rounded-xl flex flex-col">
                <span className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">Registered Tutors</span>
                <span className="text-xl font-extrabold text-emerald-400 mt-1">
                  {allProfiles.length > 0 ? allProfiles.filter((p) => p.user?.role === "TUTOR").length : 0} Active
                </span>
              </div>
              <div className="bg-slate-900/40 border border-slate-200 dark:border-slate-850 p-4 rounded-xl flex flex-col">
                <span className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">Registered Parents</span>
                <span className="text-xl font-extrabold text-indigo-400 mt-1">
                  {allProfiles.length > 0 ? allProfiles.filter((p) => p.user?.role === "PARENT").length : 0} Active
                </span>
              </div>
              <div className="bg-slate-900/40 border border-slate-200 dark:border-slate-850 p-4 rounded-xl flex flex-col">
                <span className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">GPS Mismatches</span>
                <span className={`text-xl font-extrabold mt-1 ${mismatchAlerts > 0 ? "text-yellow-500" : "text-slate-600 dark:text-slate-400"}`}>
                  {mismatchAlerts} Flagged
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECURE ADMINISTRATIVE SEARCH PANEL */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              🔍 Secure Administrative Search Panel
            </h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Query unmasked records directly from the database core
            </p>
          </div>

          <form onSubmit={handleAdminSearch} className="flex flex-col md:flex-row gap-3">
            <div className="w-full md:w-64">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as "user" | "tuition")}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-200 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              >
                <option value="user">Search User by Reg No.</option>
                <option value="tuition">Search Tuition by ID</option>
              </select>
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchType === "user" ? "Enter Reg No (e.g. TC-001) or CUID, Email, Phone..." : "Enter Tuition ID (e.g. TCT-001) or job CUID..."}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={searchLoading || !searchQuery.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-extrabold px-6 py-3 rounded-xl transition duration-200 cursor-pointer text-xs font-mono uppercase tracking-wider shrink-0 flex items-center justify-center gap-2"
              >
                {searchLoading ? (
                  <>
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                    Searching...
                  </>
                ) : (
                  "Execute Search"
                )}
              </button>

              {(userSearchResult || tuitionSearchResult || searchError) && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl transition duration-200 cursor-pointer text-xs font-mono uppercase tracking-wider font-bold"
                >
                  Clear Results
                </button>
              )}
            </div>
          </form>

          {/* Error Message */}
          {searchError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-mono flex items-center gap-2 animate-fadeIn">
              <span>⚠️</span>
              <span>{searchError}</span>
            </div>
          )}
        </div>

        {!(userSearchResult || tuitionSearchResult) ? (
          <>
            {/* Dynamic Glassmorphism Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2.5 rounded-xl font-bold font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex-grow sm:flex-grow-0 text-center ${
              activeTab === "documents"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                : "bg-slate-900/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            📋 Task Inbox ({pendingProfiles.length + jobs.filter((j) => j.status === "PENDING").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tutors")}
            className={`px-4 py-2.5 rounded-xl font-bold font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex-grow sm:flex-grow-0 text-center ${
              activeTab === "tutors"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                : "bg-slate-900/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            🎓 Tutor Directory ({allProfiles.length > 0 ? allProfiles.filter((p) => p.user?.role === "TUTOR").length : 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("parents")}
            className={`px-4 py-2.5 rounded-xl font-bold font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex-grow sm:flex-grow-0 text-center ${
              activeTab === "parents"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                : "bg-slate-900/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            👥 Parent Directory ({allProfiles.length > 0 ? allProfiles.filter((p) => p.user?.role === "PARENT").length : 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("blacklist")}
            className={`px-4 py-2.5 rounded-xl font-bold font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex-grow sm:flex-grow-0 text-center ${
              activeTab === "blacklist"
                ? "bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                : "bg-slate-900/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            🚫 Blacklist Manager
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2.5 rounded-xl font-bold font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex-grow sm:flex-grow-0 text-center ${
              activeTab === "jobs"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                : "bg-slate-900/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            📋 Tuition Jobs ({jobs.filter((j) => j.status !== "CONFIRMED").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("confirmedJobs")}
            className={`px-4 py-2.5 rounded-xl font-bold font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex-grow sm:flex-grow-0 text-center ${
              activeTab === "confirmedJobs"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                : "bg-slate-900/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            ✅ Confirmed Jobs ({jobs.filter((j) => j.status === "CONFIRMED").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2.5 rounded-xl font-bold font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex-grow sm:flex-grow-0 text-center ${
              activeTab === "payments"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                : "bg-slate-900/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 justify-center">
              <span>💰 Finance Manager</span>
              {payments.filter((p) => p.status === "PENDING").length > 0 && (
                <span className="px-1.5 py-0.5 rounded border font-extrabold text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400">
                  {payments.filter((p) => p.status === "PENDING").length} PENDING
                </span>
              )}
            </div>
          </button>
        </div>

        {/* TAB Content Rendering */}
        <AnimatePresence mode="wait">
          {activeTab === "documents" && (
            <motion.div
              key="documentsTab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Pending Tuition Approvals Card */}
              <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-heading text-amber-400">Tuition Approval Directory</h2>
                  <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                    Review tutor requirements, edit if necessary, and approve parent posts to render on map
                  </p>
                </div>
                <div className="h-px bg-slate-800/80" />

                {jobs.filter((j) => (j.status || "PENDING") === "PENDING").length === 0 ? (
                  <div className="py-8 text-center bg-slate-100 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-900 rounded-xl space-y-2">

                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Pending Tuition Posts</h3>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      All parent tuition posts are approved and live on the map!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {jobs
                      .filter((j) => (j.status || "PENDING") === "PENDING")
                      .map((job) => {
                        const currentReq = editingRequirements[job.id] !== undefined 
                          ? editingRequirements[job.id] 
                          : (job.tutorRequirement || "");
                        return (
                          <div
                            key={job.id}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-200 dark:border-slate-800 transition-all duration-300"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-400 font-bold font-mono px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 rounded">
                                  TCT-{String(job.jobSeq).padStart(3, '0')}
                                </span>
                                <span className="text-[10px] text-yellow-500 bg-yellow-500/5 border border-yellow-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                  Pending Approval
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-[9px] text-slate-500 font-mono block">Class & Subject</span>
                                  <span className="text-slate-200 font-semibold">{job.classLevel} - {job.subject}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 font-mono block">Salary</span>
                                  <span className="text-pink-400 font-bold font-mono">৳ {job.salary} BDT</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[9px] text-slate-500 font-mono block">Guardian</span>
                                  <span className="text-slate-700 dark:text-slate-300">{job.parent?.name || "N/A"} ({job.parent?.profile?.phone || "N/A"})</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[9px] text-slate-500 font-mono block">Details Description</span>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal line-clamp-2">{job.description || "No description provided."}</p>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-200 dark:border-slate-900/60">
                                <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">Tutor Requirement (Admin Editable)</label>
                                <input
                                  type="text"
                                  value={currentReq}
                                  onChange={(e) => setEditingRequirements(prev => ({ ...prev, [job.id]: e.target.value }))}
                                  className="w-full bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200 mt-1"
                                  placeholder="e.g. Public Varsity Only, BUET/DU Students Only"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-900/60">
                              <button
                                type="button"
                                onClick={() => handleApproveJob(job.id, currentReq)}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider cursor-pointer border-none transition duration-200 text-center"
                              >
                                Approve & Post Live
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteJob(job.id)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider cursor-pointer transition duration-200"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Educator Credentials Audit</h2>
                  <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">Inspect and authorize pending tutor verifications</p>
                </div>
                <div className="h-px bg-slate-800/80" />

                {loadingProfiles ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Retrieving queue...</span>
                  </div>
                ) : pendingProfiles.length === 0 ? (
                  <div className="py-12 text-center bg-slate-100 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-900 rounded-xl space-y-2">

                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Clean Inspection Registry</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      All educator credential uploads have been processed! No pending verification requests in the queue.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-5 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Educator Details</th>
                          <th className="px-5 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Education & Bio</th>
                          <th className="px-5 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Docs</th>
                          <th className="px-5 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pendingProfiles.slice((currentPagePending - 1) * ITEMS_PER_PAGE, currentPagePending * ITEMS_PER_PAGE).map((profile) => (
                          <tr key={profile.id}>
                            <td className="px-5 py-5 align-top w-[25%]">
                              <div className="flex flex-col space-y-2">
                                <span className="text-xs font-bold text-blue-700 px-2 py-1 bg-blue-50 border border-blue-100 rounded w-fit">
                                  {getVisualId(profile.user?.role || "TUTOR", profile.tutorSeq)}
                                </span>
                                <span className="text-base font-bold text-black">{profile.user?.name || "Anonymous"}</span>
                                <span className="text-xs text-gray-600 truncate max-w-[200px]" title={profile.user?.email}>{profile.user?.email}</span>
                                <span className="text-xs text-gray-600">📞 {profile.phone || "No phone"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-5 align-top w-[45%]">
                              <div className="flex flex-col space-y-4 text-sm leading-relaxed">
                                <div>
                                  <span className="font-bold text-gray-700 mr-2">Education:</span>
                                  <span className="text-black">{profile.education || "Not specified"}</span>
                                  {profile.pendingEducation && (
                                    <div className="mt-2 bg-green-50 border border-green-200 p-3 rounded-lg text-green-800">
                                      <strong className="block mb-1 text-xs">Proposed Education Update:</strong>
                                      <span>{profile.pendingEducation}</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold text-gray-700 mr-2">Bio:</span>
                                  <span className="text-black italic line-clamp-3" title={profile.bio}>"{profile.bio || "No bio"}"</span>
                                  {profile.pendingBio && (
                                    <div className="mt-2 bg-green-50 border border-green-200 p-3 rounded-lg text-green-800">
                                      <strong className="block mb-1 text-xs">Proposed Bio Update:</strong>
                                      <span className="italic line-clamp-3" title={profile.pendingBio}>"{profile.pendingBio}"</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-5 align-top text-center w-[10%]">
                              <button
                                type="button"
                                onClick={() => setPreviewDocuments({
                                  nid: profile.nidImageUrl,
                                  idCard: profile.universityIdImageUrl,
                                  selfie: profile.selfieImageUrl,
                                  name: profile.user?.name || "Educator",
                                  profileId: profile.id
                                })}
                                className="inline-flex items-center justify-center p-3 bg-white text-black border border-gray-300 rounded-lg cursor-pointer"
                                title="Preview Documents"
                              >
                                <span className="text-xl">🔍</span>
                              </button>
                            </td>
                            <td className="px-5 py-5 align-top text-right w-[20%]">
                              <div className="flex flex-col items-end space-y-3">
                                <button
                                  type="button"
                                  onClick={() => handleVerify(profile.id, "VERIFIED")}
                                  className="w-[120px] bg-green-600 text-slate-900 dark:text-white py-2 rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  Approve Profile
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectionPromptProfileId(profile.id)}
                                  className="w-[120px] bg-red-100 text-red-700 border border-red-300 py-2 rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  Reject Scan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(profile)}
                                  className="w-[120px] bg-white text-black border border-gray-300 py-2 rounded-lg text-xs font-bold cursor-pointer flex items-center justify-center space-x-2"
                                >
                                  <span>✏️</span> <span>Edit Data</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!loadingProfiles && pendingProfiles.length > ITEMS_PER_PAGE && (
                  <div className="flex justify-center items-center mt-8 space-x-4">
                    <button
                      onClick={() => setCurrentPagePending(p => Math.max(1, p - 1))}
                      disabled={currentPagePending === 1}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-slate-600 font-mono font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      Page {currentPagePending} of {Math.ceil(pendingProfiles.length / ITEMS_PER_PAGE)}
                    </span>
                    <button
                      onClick={() => setCurrentPagePending(p => Math.min(Math.ceil(pendingProfiles.length / ITEMS_PER_PAGE), p + 1))}
                      disabled={currentPagePending === Math.ceil(pendingProfiles.length / ITEMS_PER_PAGE)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "tutors" && (
            <motion.div
              key="tutorsTab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {renderDirectoryTab("TUTOR")}
            </motion.div>
          )}

          {activeTab === "parents" && (
            <motion.div
              key="parentsTab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {renderDirectoryTab("PARENT")}
            </motion.div>
          )}

          {activeTab === "blacklist" && (
            <motion.div
              key="blacklistTab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="glass-card rounded-2xl p-6 md:p-8 border border-red-500/20 space-y-6 relative overflow-hidden bg-white dark:bg-slate-950">
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-500/5 rounded-full filter blur-[60px] pointer-events-none" />
                <div>
                  <h2 className="text-xl font-bold font-heading text-red-400">Blacklisted Phone Numbers</h2>
                  <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                    These numbers are permanently blocked from registering new accounts.
                  </p>
                </div>
                <div className="h-px bg-slate-800/80" />

                {loadingBlacklist ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full" />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Fetching blacklist...</span>
                  </div>
                ) : blacklisted.length === 0 ? (
                  <div className="py-12 text-center bg-slate-100 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-900 rounded-xl space-y-2 animate-fadeIn">
                    <span className="text-3xl">✅</span>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Banned Users</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      The blacklist is currently empty. No numbers have been banned.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {blacklisted.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 hover:border-red-500/30 transition-all duration-300 animate-fadeIn relative"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {item.phone}
                              <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-mono uppercase tracking-wider font-bold">
                                Banned
                              </span>
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                              {item.name || "Unknown"} | {item.role || "UNKNOWN"}
                            </p>
                            <p className="text-[10px] text-slate-500 font-sans mt-2 italic bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800/60">
                              Reason: {item.reason || "No reason provided."}
                            </p>
                          </div>
                          <button
                            onClick={() => handleUnban(item.id)}
                            className="bg-white dark:bg-slate-950 hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer text-[10px] font-bold font-mono uppercase"
                            title="Remove from Blacklist"
                          >
                            Unban
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}


          {activeTab === "jobs" && (
            <motion.div
              key="jobsTab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading text-emerald-400">Tuition Jobs Management Directory</h2>
                    <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                      Assign tutors manually and monitor tuition active statuses
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-850 font-mono text-xs text-slate-600 dark:text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{jobs.filter((j) => j.status === "OPEN" && j.tutorId).length} Pending Manual Assignments</span>
                  </div>
                </div>

                <div className="h-px bg-slate-800/80" />

                {loadingJobs ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Fetching job listings...</span>
                  </div>
                ) : jobs.filter((j) => j.status !== "CONFIRMED").length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-mono text-sm">
                    No active tuition jobs found.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {jobs.filter((j) => j.status !== "CONFIRMED").map((job) => {
                      const isPendingManual = job.status === "OPEN" && job.tutorId;
                      return (
                        <div
                          key={job.id}
                          className={`bg-white dark:bg-slate-950/60 border p-5 rounded-2xl flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between transition-all duration-300 ${
                            isPendingManual ? "border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_4px_16px_rgba(var(--theme-rgb),0.03)]" : "border-slate-200 dark:border-slate-850 hover:border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <div className="space-y-3 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 font-extrabold uppercase">
                                TCT-{String(job.jobSeq).padStart(3, '0')}
                              </span>
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md border font-extrabold uppercase tracking-wider bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20">
                                ৳ {job.salary} BDT
                              </span>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border font-extrabold uppercase tracking-wider ${
                                job.status === "ASSIGNED" 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : job.status === "COMPLETED"
                                  ? "bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}>
                                {job.status}
                              </span>
                              {job.locationUnlocked && (
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-md border font-extrabold uppercase tracking-wider bg-emerald-500 text-slate-950 border-emerald-500">
                                  Unlocked
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs pt-3 mt-3 border-t border-slate-200 dark:border-slate-800/60">
                              <div>
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">Tuition Job Title</span>
                                <span className="text-slate-200 font-semibold">{job.title}</span>
                                <span className="text-slate-600 dark:text-slate-400 text-[10px] block">{job.subject} - {job.classLevel}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">Parent (Creator)</span>
                                <span className="text-slate-200 font-semibold">{job.parent?.name || "N/A"}</span>
                                <span className="text-slate-600 dark:text-slate-400 text-[10px] font-mono block">Phone: {job.parent?.profile?.phone || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">Tutor Assignment</span>
                                {job.tutor ? (
                                  <div>
                                    <span className="text-emerald-400 font-semibold font-mono">
                                      TC-{String(job.tutor.profile?.tutorSeq || 1).padStart(3, '0')} - {job.tutor.name}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400 text-[10px] font-mono block">Phone: {job.tutor.profile?.phone || "N/A"}</span>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                      {job.commissionPaid ? (
                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                          ✓ Commission Paid ৳{job.commissionAmount || Math.ceil(job.salary * 0.10)}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                          Commission Unpaid
                                        </span>
                                      )}
                                      {job.tutorDetailsReleased && (
                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                          ✓ Details Released
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic">No tutor applied yet</span>
                                )}
                              </div>
                            </div>
                            {/* Progress Tracking Stats */}
                            {job.tutor && (
                              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 space-y-1">
                                <span className="text-[9px] text-indigo-400 font-mono uppercase tracking-wider block font-bold">📊 Progress Tracking</span>
                                <div className="flex flex-wrap gap-2 items-center">
                                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${
                                    job.progressCount > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700"
                                  }`}>
                                    {job.progressCount || 0} Updates
                                  </span>
                                  {job.lastProgressUpdate && (
                                    <>
                                      <span className="text-[9px] font-mono text-slate-500">
                                        Last: {new Date(job.lastProgressUpdate.createdAt).toLocaleDateString()}
                                      </span>
                                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                        job.lastProgressUpdate.seen ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                      }`}>
                                        {job.lastProgressUpdate.seen ? "Guardian Viewed" : "Unseen"}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Commission & Refund Management */}
                            {job.tutor && (
                              <div className="bg-black/20 border border-slate-200 dark:border-slate-900 rounded-xl p-3 space-y-2">
                                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block font-bold">Commission Management</span>
                                <div className="flex flex-wrap gap-2 items-center">
                                  {!job.commissionPaid && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await fetchApi("/admin/jobs", {
                                            method: "PATCH",
                                            body: JSON.stringify({ jobId: job.id, action: "verify-payment" })
                                          });
                                          fetchJobsList(); alert("Payment verified and details unlocked.");
                                        } catch(err) { alert("Failed to verify payment."); }
                                      }}
                                      className="bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer transition duration-150"
                                    >
                                      Verify Payment & Unlock
                                    </button>
                                  )}
                                  {!job.tutorDetailsReleased && !job.commissionPaid && (
                                    <button
                                      type="button"
                                      onClick={() => handleReleaseTutorDetails(job.id)}
                                      className="bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer transition duration-150"
                                      title="Release tutor details to parent dashboard"
                                    >
                                      Release Details
                                    </button>
                                  )}
                                  
                                  {/* Refund Request Handling */}
                                  {job.payments && job.payments.map((payment: any) => (
                                    payment.refundStatus === "REQUESTED" && (
                                      <div key={payment.id} className="flex gap-2 items-center bg-red-500/10 p-2 rounded-lg border border-red-500/20 w-full mt-2">
                                        <div className="flex-1">
                                          <span className="text-[10px] text-red-400 font-bold block">Refund Requested</span>
                                          <span className="text-[9px] text-slate-600 dark:text-slate-400 block italic">Reason: {payment.refundReason}</span>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              try {
                                                await fetchApi("/admin/jobs", {
                                                  method: "PATCH",
                                                  body: JSON.stringify({ jobId: job.id, paymentId: payment.id, action: "approve-refund" })
                                                });
                                                fetchJobsList(); alert("Refund approved.");
                                              } catch (err) { alert("Failed to approve refund."); }
                                            }}
                                            className="bg-red-600/25 hover:bg-red-600/40 text-red-400 border border-red-500/30 px-2 py-1 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer transition"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              try {
                                                await fetchApi("/admin/jobs", {
                                                  method: "PATCH",
                                                  body: JSON.stringify({ jobId: job.id, paymentId: payment.id, action: "reject-refund" })
                                                });
                                                fetchJobsList(); alert("Refund rejected.");
                                              } catch (err) { alert("Failed to reject refund."); }
                                            }}
                                            className="bg-slate-700 hover:bg-slate-600 text-slate-700 dark:text-slate-300 border border-slate-600 px-2 py-1 rounded-lg text-[9px] font-mono font-bold uppercase cursor-pointer transition"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  ))}
                                  {job.payments && job.payments.some((p: any) => p.refundStatus === "APPROVED") && (
                                    <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                      Refund Approved
                                    </span>
                                  )}
                                  {job.payments && job.payments.some((p: any) => p.refundStatus === "REJECTED") && (
                                    <span className="text-[9px] bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                      Refund Rejected
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {isPendingManual && job.tutorId && (
                            <div className="flex gap-2 shrink-0 items-center justify-end">
                              <button
                                onClick={() => handleAssignTutor(job.id, job.tutorId)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl transition duration-200 cursor-pointer text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(var(--theme-rgb),0.1)] border-none"
                              >
                                Assign Tutor Manually
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "confirmedJobs" && (
            <motion.div
              key="confirmedJobsTab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading text-emerald-400">Confirmed Jobs Directory</h2>
                    <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                      View all jobs that have been confirmed and unlocked.
                    </p>
                  </div>
                </div>

                <div className="h-px bg-slate-800/80" />

                {loadingJobs ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">Fetching job listings...</span>
                  </div>
                ) : jobs.filter(j => j.status === "CONFIRMED").length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-mono text-sm">
                    No confirmed tuition jobs found.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {jobs.filter(j => j.status === "CONFIRMED").map((job) => {
                      return (
                        <div
                          key={job.id}
                          className={`bg-white dark:bg-slate-950/60 border p-5 rounded-2xl flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between transition-all duration-300 border-slate-200 dark:border-slate-850 hover:border-slate-200 dark:border-slate-800`}
                        >
                          <div className="space-y-3 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 font-extrabold uppercase">
                                TCT-{String(job.jobSeq).padStart(3, '0')}
                              </span>
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md border font-extrabold uppercase tracking-wider bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20">
                                ৳ {job.salary} BDT
                              </span>
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md border font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                {job.status}
                              </span>
                              {job.locationUnlocked && (
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-md border font-extrabold uppercase tracking-wider bg-emerald-500 text-slate-950 border-emerald-500">
                                  Unlocked
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs pt-3 mt-3 border-t border-slate-200 dark:border-slate-800/60">
                              <div>
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">Tuition Job Title</span>
                                <span className="text-slate-200 font-semibold">{job.title}</span>
                                <span className="text-slate-600 dark:text-slate-400 text-[10px] block">{job.subject} - {job.classLevel}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">Parent (Creator)</span>
                                <span className="text-slate-200 font-semibold">{job.parent?.name || "N/A"}</span>
                                <span className="text-slate-600 dark:text-slate-400 text-[10px] font-mono block">Phone: {job.parent?.profile?.phone || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">Tutor Assignment</span>
                                {job.tutor ? (
                                  <div>
                                    <span className="text-emerald-400 font-semibold font-mono">
                                      TC-{String(job.tutor.profile?.tutorSeq || 1).padStart(3, '0')} - {job.tutor.name}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400 text-[10px] font-mono block">Phone: {job.tutor.profile?.phone || "N/A"}</span>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                      {job.commissionPaid ? (
                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                          ✓ Commission Paid (৳{job.commissionAmount || Math.ceil(job.salary * 0.10)})
                                        </span>
                                      ) : (
                                        <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                          Pending Commission
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic">No tutor assigned</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "payments" && (
            <motion.div
              key="paymentsTab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-heading text-emerald-400">Finance Manager</h2>
                  <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                    Overview of all payments, commissions, and refunds across the platform.
                  </p>
                </div>
                <div className="h-px bg-slate-800/80" />

                {(() => {
                  const pendingAmount = payments.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + (p.amount || 0), 0);
                  const receivedAmount = payments.filter(p => p.status === 'COMPLETED').reduce((acc, p) => acc + (p.amount || 0), 0);
                  const refundedAmount = payments.filter(p => p.status === 'REFUNDED').reduce((acc, p) => acc + (p.amount || 0), 0);

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total Received</span>
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">৳ {receivedAmount}</span>
                      </div>
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Pending Clearance</span>
                        <span className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">৳ {pendingAmount}</span>
                      </div>
                      <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total Refunded</span>
                        <span className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono">৳ {refundedAmount}</span>
                      </div>
                    </div>
                  );
                })()}

                {loadingPayments ? (
                  <div className="py-8 text-center text-slate-500 font-mono text-sm">Loading financial records...</div>
                ) : payments.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-mono text-sm">
                    No payment records found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-4">Transaction ID</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p: any) => (
                          <tr key={p.id} className="border-b border-slate-200 dark:border-slate-900 hover:bg-slate-900/20 transition-colors">
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono">{p.trxId || "N/A"}</td>
                            <td className="py-3 px-4">
                              <span className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-mono text-[10px] uppercase">
                                {p.type || "PAYMENT"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-emerald-400 font-bold font-mono">
                              ৳ {p.amount}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                p.status === "COMPLETED" || p.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                p.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                "bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-700"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-mono">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              {p.status === "PENDING" && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApprovePayment(p.id)}
                                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded text-[10px] font-mono font-bold uppercase cursor-pointer transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectPayment(p.id)}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded text-[10px] font-mono font-bold uppercase cursor-pointer transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {userSearchResult && (
              <div className="bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading text-emerald-400">
                      User Inspection Profile: {userSearchResult.name || "Operator"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                      Full unmasked administrative record view
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-850 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
                  >
                    Close Inspection
                  </button>
                </div>

                <div className="h-px bg-slate-800/80" />

                {/* Structured user info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-850 pb-2">
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Full Name</span>
                        <span className="text-slate-200 font-semibold">{userSearchResult.name || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Email Address</span>
                        <span className="text-slate-200 font-semibold select-all">{userSearchResult.email || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Contact Phone</span>
                        <span className="text-slate-200 font-semibold select-all">{userSearchResult.profile?.phone || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">System Role</span>
                        <span className="text-emerald-400 font-bold uppercase font-mono">{userSearchResult.role}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Joined Date</span>
                        <span className="text-slate-600 dark:text-slate-400">{new Date(userSearchResult.createdAt).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Last Updated</span>
                        <span className="text-slate-600 dark:text-slate-400">{new Date(userSearchResult.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Security & Status */}
                  <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-850 pb-2">
                      Account Security & Status
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Account Status</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          userSearchResult.profile?.is_active !== false
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {userSearchResult.profile?.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Verification Status</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          userSearchResult.profile?.verificationStatus === "VERIFIED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : userSearchResult.profile?.verificationStatus === "PENDING"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-700"
                        }`}>
                          {userSearchResult.profile?.verificationStatus || "UNVERIFIED"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Reactivation Requested</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          userSearchResult.profile?.reactivationRequested
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse"
                            : "bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-700"
                        }`}>
                          {userSearchResult.profile?.reactivationRequested ? "Yes (⚠️ Pending)" : "No"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">User Reference ID</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono">
                          {userSearchResult.role === "TUTOR"
                            ? `TC-${String(userSearchResult.profile?.tutorSeq || 1).padStart(3, '0')}`
                            : `TP-${String(userSearchResult.profile?.tutorSeq || 1).padStart(3, '0')}`}
                        </span>
                      </div>
                    </div>

                    {/* Manage user status in searched view */}
                    {userSearchResult.role === "TUTOR" && userSearchResult.profile && (
                      <div className="pt-2 flex gap-2 border-t border-slate-200 dark:border-slate-850">
                        <button
                          type="button"
                          onClick={() => handleToggleTutorActive(userSearchResult.profile.id, !userSearchResult.profile.is_active)}
                          className={`w-full py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer text-center border transition-all ${
                            userSearchResult.profile.is_active !== false
                              ? "bg-red-950/20 hover:bg-red-950/40 text-red-400 border-red-500/20"
                              : "bg-emerald-600 hover:bg-emerald-500 text-slate-950 border-emerald-600"
                          }`}
                        >
                          {userSearchResult.profile.reactivationRequested && !userSearchResult.profile.is_active
                            ? "Approve Reactivation"
                            : userSearchResult.profile.is_active !== false
                            ? "Deactivate Tutor"
                            : "Activate Tutor"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Extra Data / Location */}
                {userSearchResult.profile && (
                  <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-850 pb-2">
                      Profile Configurations & Location Coordinates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block">Configured Address</span>
                          <span className="text-slate-200 font-semibold">{userSearchResult.profile.address || "No address configured"}</span>
                        </div>
                        {userSearchResult.role === "TUTOR" && (
                          <>
                            <div>
                              <span className="text-[10px] text-slate-500 font-mono block">Education Details</span>
                              <span className="text-slate-200 font-semibold">{userSearchResult.profile.education || "No education history"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-mono block">Biography</span>
                              <span className="text-slate-700 dark:text-slate-300 italic">"{userSearchResult.profile.bio || "No biography configured"}"</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-mono block">Preferred Time / Gender</span>
                              <span className="text-slate-200 font-mono text-[10px]">
                                {userSearchResult.profile.preferable_time || "Any time"} | {userSearchResult.profile.gender || "Any"}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="bg-slate-900/40 p-4 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2 font-mono">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">GPS Coordinates</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-500 block">Claimed Lat/Lng</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {userSearchResult.profile.latitude?.toFixed(6) || "N/A"}, {userSearchResult.profile.longitude?.toFixed(6) || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block">Device GPS Lat/Lng</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {userSearchResult.profile.actualLatitude?.toFixed(6) || "N/A"}, {userSearchResult.profile.actualLongitude?.toFixed(6) || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Lists */}
                <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-850 pb-2">
                    Linked Logs / Activity History
                  </h3>
                  
                  {userSearchResult.role === "PARENT" ? (
                    <div className="space-y-2 text-xs">
                      <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">Tuition Post Listings ({userSearchResult.tuitionJobs?.length || 0})</div>
                      {!userSearchResult.tuitionJobs || userSearchResult.tuitionJobs.length === 0 ? (
                        <div className="text-slate-500 italic py-2">No tuition posts logs registered.</div>
                      ) : (
                        <div className="border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden">
                          <table className="w-full text-left font-mono">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] uppercase">
                              <tr>
                                <th className="p-3">Job ID</th>
                                <th className="p-3">Title</th>
                                <th className="p-3">Subject/Class</th>
                                <th className="p-3">Salary</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850 text-slate-700 dark:text-slate-300">
                              {userSearchResult.tuitionJobs.map((j: any) => (
                                <tr key={j.id} className="hover:bg-slate-900/30">
                                  <td className="p-3">TCT-{String(j.jobSeq).padStart(3, '0')}</td>
                                  <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">{j.title}</td>
                                  <td className="p-3">{j.subject} ({j.classLevel})</td>
                                  <td className="p-3">৳{j.salary} BDT</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      j.status === "ASSIGNED" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                    }`}>
                                      {j.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteJob(j.id)}
                                      className="bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/20 px-2.5 py-1 rounded text-[10px] cursor-pointer"
                                    >
                                      Delete Post
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">Applied & Assigned Jobs ({userSearchResult.appliedJobs?.length || 0})</div>
                      {!userSearchResult.appliedJobs || userSearchResult.appliedJobs.length === 0 ? (
                        <div className="text-slate-500 italic py-2">No tuition jobs logs registered.</div>
                      ) : (
                        <div className="border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden">
                          <table className="w-full text-left font-mono">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] uppercase">
                              <tr>
                                <th className="p-3">Job ID</th>
                                <th className="p-3">Title</th>
                                <th className="p-3">Guardian</th>
                                <th className="p-3">Class/Subject</th>
                                <th className="p-3">Salary</th>
                                <th className="p-3">Assign Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850 text-slate-700 dark:text-slate-300">
                              {userSearchResult.appliedJobs.map((j: any) => (
                                <tr key={j.id} className="hover:bg-slate-900/30">
                                  <td className="p-3">TCT-{String(j.jobSeq).padStart(3, '0')}</td>
                                  <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">{j.title}</td>
                                  <td className="p-3 font-sans">{j.parent?.name || "Guardian"}</td>
                                  <td className="p-3">{j.subject} ({j.classLevel})</td>
                                  <td className="p-3">৳{j.salary} BDT</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      j.tutorId === userSearchResult.id ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-600 dark:text-slate-400"
                                    }`}>
                                      {j.tutorId === userSearchResult.id ? "Assigned" : "Applied"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Raw Database Payload */}
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">Raw Database Record (JSON Inspector)</div>
                  <pre className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl text-[10px] font-mono text-emerald-400 overflow-auto max-h-[300px] leading-relaxed select-all">
                    {JSON.stringify(userSearchResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {tuitionSearchResult && (
              <div className="bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 rounded-3xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading text-emerald-400">
                      Tuition Post Inspection: TCT-{String(tuitionSearchResult.jobSeq).padStart(3, '0')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                      Complete unmasked tuition details and status
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-850 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
                  >
                    Close Inspection
                  </button>
                </div>

                <div className="h-px bg-slate-800/80" />

                {/* Details layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Job Specs */}
                  <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-850 pb-2">
                      Tuition Job Specifications
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Title</span>
                        <span className="text-slate-200 font-semibold">{tuitionSearchResult.title}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Class & Subject</span>
                        <span className="text-slate-200 font-semibold">{tuitionSearchResult.classLevel} - {tuitionSearchResult.subject}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Salary Offered</span>
                        <span className="text-pink-400 font-bold font-mono">৳{tuitionSearchResult.salary} BDT</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Active Status</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          tuitionSearchResult.status === "ASSIGNED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : tuitionSearchResult.status === "COMPLETED"
                            ? "bg-slate-800 text-slate-600 dark:text-slate-400"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {tuitionSearchResult.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Location Unlocked</span>
                        <span className="text-slate-200 font-semibold">{tuitionSearchResult.locationUnlocked ? "Yes (✓)" : "No (Locked)"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Tutor Details Released</span>
                        <span className="text-slate-200 font-semibold">{tuitionSearchResult.tutorDetailsReleased ? "Yes (✓)" : "No (Released Locked)"}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-850 space-y-2">
                      <div className="text-[10px] text-slate-500 font-mono uppercase block">Description</div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{tuitionSearchResult.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-850 space-y-2">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">Tutor Requirement (Admin Editable)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="searchRequirementInput"
                          defaultValue={tuitionSearchResult.tutorRequirement || ""}
                          className="flex-1 bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                          placeholder="e.g. Public Varsity Only, CSE Department, BUET/DU Students Only"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const reqVal = (document.getElementById("searchRequirementInput") as HTMLInputElement)?.value;
                            try {
                              await fetchApi("/admin/jobs", {
                                method: "PATCH",
                                body: JSON.stringify({ jobId: tuitionSearchResult.id, action: "updateRequirement", tutorRequirement: reqVal }),
                              });
                              alert("✓ Tutor requirement updated successfully.");
                              handleReFetchSearch();
                              fetchJobsList();
                            } catch(err) {
                              alert("Failed to update requirement.");
                            }
                          }}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-bold font-sans uppercase transition duration-200"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Interactive management buttons */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-850 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(tuitionSearchResult.id)}
                        className="bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
                      >
                        Delete Post
                      </button>

                      {tuitionSearchResult.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={async () => {
                            const reqVal = (document.getElementById("searchRequirementInput") as HTMLInputElement)?.value;
                            await handleApproveJob(tuitionSearchResult.id, reqVal);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer border-none"
                        >
                          Approve & Post Live
                        </button>
                      )}

                      {tuitionSearchResult.status === "OPEN" && tuitionSearchResult.tutorId && (
                        <button
                          type="button"
                          onClick={() => handleAssignTutor(tuitionSearchResult.id, tuitionSearchResult.tutorId)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer border-none"
                        >
                          Assign Tutor Manually
                        </button>
                      )}

                      {tuitionSearchResult.tutorId && !tuitionSearchResult.tutorDetailsReleased && (
                        <button
                          type="button"
                          onClick={() => handleReleaseTutorDetails(tuitionSearchResult.id)}
                          className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer"
                        >
                          Release Details
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Associated Users */}
                  <div className="space-y-6">
                    {/* Guardian Info */}
                    <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-850 pb-2">
                        Guardian Profile Details
                      </h3>
                      {tuitionSearchResult.parent ? (
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Name</span>
                            <span className="text-slate-200 font-semibold font-sans">{tuitionSearchResult.parent.name || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Email</span>
                            <span className="text-slate-700 dark:text-slate-300 select-all">{tuitionSearchResult.parent.email || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Contact Phone</span>
                            <span className="text-slate-700 dark:text-slate-300 select-all">{tuitionSearchResult.parent.profile?.phone || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Coordinates</span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {tuitionSearchResult.latitude?.toFixed(5) || "N/A"}, {tuitionSearchResult.longitude?.toFixed(5) || "N/A"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 italic text-xs">No linked Guardian details found.</div>
                      )}
                    </div>

                    {/* Tutor Info */}
                    <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-850 pb-2">
                        Assigned/Applied Tutor Details
                      </h3>
                      {tuitionSearchResult.tutor ? (
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Tutor Reg No.</span>
                            <span className="text-slate-200">TC-{String(tuitionSearchResult.tutor.profile?.tutorSeq || 1).padStart(3, '0')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Name</span>
                            <span className="text-slate-200 font-semibold font-sans">{tuitionSearchResult.tutor.name || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Email</span>
                            <span className="text-slate-700 dark:text-slate-300 select-all">{tuitionSearchResult.tutor.email || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Contact Phone</span>
                            <span className="text-slate-700 dark:text-slate-300 select-all">{tuitionSearchResult.tutor.profile?.phone || "N/A"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 italic text-xs">No tutor currently assigned to this post.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Raw Database Payload */}
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">Raw Database Record (JSON Inspector)</div>
                  <pre className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl text-[10px] font-mono text-emerald-400 overflow-auto max-h-[300px] leading-relaxed select-all">
                    {JSON.stringify(tuitionSearchResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PREMIUM IN-APP REJECTION PROMPT DIALOG MODAL */}
      <AnimatePresence>
        {rejectionPromptProfileId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-white dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl max-w-lg w-full scale-100 shadow-2xl space-y-6 relative bg-white dark:bg-slate-950"
            >
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Verification Rejection</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                  Specify details regarding why these credential scans are declined
                </p>
              </div>
              <div className="h-px bg-slate-800/80" />

              <div className="space-y-4">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                  Select Predefined Explanation
                </label>
                <div className="space-y-2">
                  {REJECTION_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      onClick={() => {
                        setRejectionReasonInput(tmpl);
                        setCustomRejectionSelected(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl text-xs font-sans border transition duration-200 ${
                        rejectionReasonInput === tmpl && !customRejectionSelected
                          ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400 font-bold"
                          : "bg-slate-900/60 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:border-slate-800 hover:text-slate-350"
                      }`}
                    >
                      {tmpl}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setRejectionReasonInput("");
                      setCustomRejectionSelected(true);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-mono uppercase tracking-wider font-bold border transition duration-200 ${
                      customRejectionSelected
                        ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400"
                        : "bg-slate-900/60 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    ✏️ Custom Explanation Input...
                  </button>
                </div>

                {customRejectionSelected && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
                      Custom Rejection Explanation
                    </label>
                    <textarea
                      value={rejectionReasonInput}
                      onChange={(e) => setRejectionReasonInput(e.target.value)}
                      rows={3}
                      required
                      placeholder="Specify precisely what document or information triggers this rejection..."
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-100 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition duration-200"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleVerify(
                      rejectionPromptProfileId,
                      "REJECTED",
                      rejectionReasonInput || "Documents could not be verified by platform administrator."
                    )
                  }
                  className="flex-grow bg-red-500 hover:bg-red-600 text-slate-950 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer shadow-[0_4px_12px_rgba(239,68,68,0.15)]"
                >
                  Confirm Rejection & Log
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectionPromptProfileId(null);
                    setRejectionReasonInput("");
                    setCustomRejectionSelected(false);
                  }}
                  className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-5 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MASTER ACCOUNT DETAILS MODAL EDITOR PORTAL */}
      <AnimatePresence>
        {editingProfile && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-white dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl max-w-xl w-full scale-100 shadow-2xl space-y-6 relative bg-white dark:bg-slate-950 max-h-[90vh] overflow-y-auto my-8"
            >
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Edit Profile: {getVisualId(editingProfile.user?.role || "PARENT", editingProfile.tutorSeq)}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                  Update database records across User, Profile and Geolocation details
                </p>
              </div>
              <div className="h-px bg-slate-800/80" />

              <form onSubmit={handleSaveProfileDetails} className="space-y-4 font-sans">
                {editError && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 py-2.5 px-3.5 rounded-xl font-mono">
                    ⚠️ {editError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">User Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">Contact Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">Claimed Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                    />
                  </div>
                </div>

                {editingProfile.user?.role === "TUTOR" && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">Educator Qualifications</label>
                      <input
                        type="text"
                        value={editForm.education}
                        onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                      />
                    </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">Biography Details</label>
                        <textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          rows={2}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                        />
                      </div>
                      
                      {(editingProfile.nidImageUrl || editingProfile.universityIdImageUrl || editingProfile.selfieImageUrl) && (
                        <div className="pt-2">
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold mb-2">Uploaded Identity Documents</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {editingProfile.nidImageUrl && (
                              <a href={editingProfile.nidImageUrl} target="_blank" rel="noreferrer" className="block group w-full aspect-[4/3] bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500 transition-colors relative">
                                <img src={editingProfile.nidImageUrl} alt="NID" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-2">
                                  <span className="text-[9px] font-mono text-slate-900 dark:text-white font-bold uppercase tracking-wider">NID / Passport</span>
                                </div>
                              </a>
                            )}
                            {editingProfile.universityIdImageUrl && (
                              <a href={editingProfile.universityIdImageUrl} target="_blank" rel="noreferrer" className="block group w-full aspect-[4/3] bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500 transition-colors relative">
                                <img src={editingProfile.universityIdImageUrl} alt="Student ID" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-2">
                                  <span className="text-[9px] font-mono text-slate-900 dark:text-white font-bold uppercase tracking-wider">Student ID</span>
                                </div>
                              </a>
                            )}
                            {editingProfile.selfieImageUrl && (
                              <a href={editingProfile.selfieImageUrl} target="_blank" rel="noreferrer" className="block group w-full aspect-[4/3] bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500 transition-colors relative">
                                <img src={editingProfile.selfieImageUrl} alt="Selfie" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-2">
                                  <span className="text-[9px] font-mono text-slate-900 dark:text-white font-bold uppercase tracking-wider">Selfie Match</span>
                                </div>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                {/* Edit status locks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">Verification Status</label>
                    <select
                      value={editForm.verificationStatus}
                      onChange={(e) => setEditForm({ ...editForm, verificationStatus: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200 cursor-pointer"
                    >
                      <option value="UNVERIFIED">UNVERIFIED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  {editForm.verificationStatus === "REJECTED" && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">Rejection Explanation</label>
                      <input
                        type="text"
                        required
                        value={editForm.rejectionReason}
                        onChange={(e) => setEditForm({ ...editForm, rejectionReason: e.target.value })}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition duration-200"
                        placeholder="Blurry credentials scans..."
                      />
                    </div>
                  )}
                </div>

                {/* Draggable location picker for admin overrides */}
                <div className="space-y-2 bg-white dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-900 rounded-2xl">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                    Admin Geolocation Override Pin Map
                  </label>
                  <MapPicker
                    initialLat={editForm.latitude}
                    initialLng={editForm.longitude}
                    onChange={({ lat, lng }) => {
                      setEditForm((prev) => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                      }));
                    }}
                  />
                </div>

                <div className="flex space-x-3 pt-3 border-t border-slate-200 dark:border-slate-900">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex-grow bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer shadow-[0_4px_12px_rgba(var(--theme-rgb),0.15)] flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <div className="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                        <span>Synchronizing changes...</span>
                      </>
                    ) : (
                      <span>Save Settings</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(null)}
                    className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* PREMIUM HIGH-FIDELITY DOCUMENT PREVIEW MODAL */}
      <AnimatePresence>
        {previewDocuments && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-white dark:bg-slate-950/90 backdrop-blur-md animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl max-w-5xl w-full scale-100 shadow-2xl space-y-6 relative bg-white dark:bg-slate-950 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Document Credentials Audit: {previewDocuments.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                    Inspect uploaded scans side-by-side to authenticate profile accuracy
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDocuments(null)}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl transition duration-200 cursor-pointer text-xs"
                >
                  ✕ Close
                </button>
              </div>
              
              <div className="h-px bg-slate-800/80" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* NID Document */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                    🪪 National ID Card (NID)
                  </h4>
                  <div className="bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-2.5 flex items-center justify-center min-h-[300px] overflow-hidden relative group">
                    {previewDocuments.nid ? (
                      <div className="flex flex-col items-center w-full space-y-3">
                        <img
                          src={previewDocuments.nid}
                          alt="National ID Card"
                          className="max-h-[300px] object-contain rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 hover:scale-105 transition-transform duration-300"
                        />
                        <div className="w-full bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-850 p-2.5 rounded-xl flex flex-col space-y-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">Direct Document Link:</span>
                          <a
                            href={previewDocuments.nid}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 hover:underline break-all block truncate text-left"
                            title={previewDocuments.nid}
                          >
                            {previewDocuments.nid}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-xs text-slate-600 space-y-1">
                        <span>🚫</span>
                        <p>No NID Uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Student ID Document */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                    🎓 Student ID / Academic ID
                  </h4>
                  <div className="bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-2.5 flex items-center justify-center min-h-[300px] overflow-hidden relative group">
                    {previewDocuments.idCard ? (
                      <div className="flex flex-col items-center w-full space-y-3">
                        <img
                          src={previewDocuments.idCard}
                          alt="Student ID Card"
                          className="max-h-[300px] object-contain rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 hover:scale-105 transition-transform duration-300"
                        />
                        <div className="w-full bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-850 p-2.5 rounded-xl flex flex-col space-y-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">Direct Document Link:</span>
                          <a
                            href={previewDocuments.idCard}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 hover:underline break-all block truncate text-left"
                            title={previewDocuments.idCard}
                          >
                            {previewDocuments.idCard}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-xs text-slate-600 space-y-1">
                        <span>🚫</span>
                        <p>No Student ID Uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tutor Photo / Picture */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                    📸 Tutor Photo / Picture
                  </h4>
                  <div className="bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-2.5 flex items-center justify-center min-h-[300px] overflow-hidden relative group">
                    {previewDocuments.selfie ? (
                      <div className="flex flex-col items-center w-full space-y-3">
                        <img
                          src={previewDocuments.selfie}
                          alt="Tutor Photo / Picture"
                          className="max-h-[300px] object-contain rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 hover:scale-105 transition-transform duration-300"
                        />
                        <div className="w-full bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-850 p-2.5 rounded-xl flex flex-col space-y-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">Direct Document Link:</span>
                          <a
                            href={previewDocuments.selfie}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 hover:underline break-all block truncate text-left"
                            title={previewDocuments.selfie}
                          >
                            {previewDocuments.selfie}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-xs text-slate-600 space-y-1">
                        <span>🚫</span>
                        <p>No Selfie Uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons inside document viewer to speed up workflow */}
              <div className="flex space-x-3 pt-3 border-t border-slate-200 dark:border-slate-900 justify-end">
                {pendingProfiles.some((p) => p.id === previewDocuments.profileId) && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleVerify(previewDocuments.profileId, "VERIFIED");
                        setPreviewDocuments(null);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-6 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer shadow-[0_4px_12px_rgba(var(--theme-rgb),0.15)] flex items-center justify-center space-x-2"
                    >
                      ✓ Approve Tutor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectionPromptProfileId(previewDocuments.profileId);
                        setPreviewDocuments(null);
                      }}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-6 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
                    >
                      ✕ Reject Tutor
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDocuments(null)}
                  className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
