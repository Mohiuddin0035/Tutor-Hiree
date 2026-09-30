"use client";
import { fetchApi } from "@/lib/api";

import { useState, useEffect, useCallback } from "react";

interface ProgressTrackerProps {
  role: "TUTOR" | "PARENT";
  jobId: string;
  jobTitle: string;
  jobSubject: string;
  guardianId?: string;
}

const UPDATE_TYPES = [
  { value: "CLASS_NOTE", label: "Class Note", icon: "📝", color: "emerald" },
  { value: "HOMEWORK", label: "Homework", icon: "📚", color: "indigo" },
  { value: "EXAM", label: "Exam", icon: "📋", color: "amber" },
  { value: "ATTENDANCE", label: "Attendance", icon: "✅", color: "blue" },
  { value: "GENERAL", label: "General", icon: "💬", color: "slate" },
];

function getTypeBadge(type: string) {
  const t = UPDATE_TYPES.find((u) => u.value === type);
  if (!t) return { label: type, icon: "📌", color: "slate" };
  return t;
}

function StarRating({ rating, setRating, readonly }: { rating: number; setRating?: (r: number) => void; readonly?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && setRating?.(star === rating ? 0 : star)}
          className={`text-lg transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} ${
            star <= rating ? "text-amber-400" : "text-slate-700"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function timeAgo(date: string | Date) {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ProgressTracker({ role, jobId, jobTitle, jobSubject, guardianId }: ProgressTrackerProps) {
  const [activeTab, setActiveTab] = useState<"updates" | "homework" | "summary">("updates");
  const [updates, setUpdates] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [hwStats, setHwStats] = useState({ total: 0, completed: 0, overdue: 0, assigned: 0 });
  const [unseenCount, setUnseenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(role === "TUTOR"); // Tutors always have access
  const [subscribing, setSubscribing] = useState(false);

  // Post form states (tutor only)
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("CLASS_NOTE");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formRating, setFormRating] = useState(0);
  const [formAttachments, setFormAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Homework form
  const [addHomework, setAddHomework] = useState(false);
  const [hwTitle, setHwTitle] = useState("");
  const [hwDesc, setHwDesc] = useState("");
  const [hwSubject, setHwSubject] = useState(jobSubject);
  const [hwDueDate, setHwDueDate] = useState("");
  const [submittingHw, setSubmittingHw] = useState(false);

  // Comment state (parent only)
  const [commentingOnId, setCommentingOnId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit state (tutor only)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const fetchUpdates = useCallback(async () => {
    try {
      const url = role === "PARENT" && guardianId ? `/progress/job/${jobId}?guardianId=${guardianId}` : `/progress/job/${jobId}`;
      const data = await fetchApi(url);
      if (Array.isArray(data)) {
        setUpdates(data);
      }
    } catch (err) {
      console.error("Failed to fetch updates:", err);
    }
  }, [jobId, role, guardianId]);

  const fetchHomeworks = useCallback(async () => {
    try {
      const url = role === "PARENT" && guardianId ? `/progress/homework/job/${jobId}?guardianId=${guardianId}` : `/progress/homework/job/${jobId}`;
      const data = await fetchApi(url);
      if (Array.isArray(data)) {
        setHomeworks(data);
        // Note: hwStats logic might need adjustment if stats are not returned anymore
      }
    } catch (err) {
      console.error("Failed to fetch homeworks:", err);
    }
  }, [jobId, role, guardianId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUpdates(), fetchHomeworks()]).then(() => setLoading(false));
  }, [fetchUpdates, fetchHomeworks]);

  // Mark updates as seen when parent opens updates tab
  useEffect(() => {
    if (role === "PARENT" && activeTab === "updates" && unseenCount > 0) {
      fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-seen", jobId }),
      }).then(() => setUnseenCount(0));
    }
  }, [role, activeTab, unseenCount, jobId]);

  // Handlers
  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await fetchApi(`/upload-attachment?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      });
      if (data) {
        setFormAttachments((prev) => [...prev, data.url]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        jobId,
        type: formType,
        title: formTitle.trim(),
        description: formDesc.trim(),
        sessionDate: formDate,
        rating: formRating || null,
        attachmentUrls: formAttachments,
      };
      if (addHomework && hwTitle.trim() && hwDueDate) {
        payload.homework = { title: hwTitle.trim(), description: hwDesc.trim(), subject: hwSubject, dueDate: hwDueDate };
      }
      await fetchApi("/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Reset form
      setFormTitle(""); setFormDesc(""); setFormRating(0); setFormAttachments([]);
      setAddHomework(false); setHwTitle(""); setHwDesc(""); setHwDueDate("");
      setShowForm(false);
      await Promise.all([fetchUpdates(), fetchHomeworks()]);
    } catch (err) {
      console.error("Submit failed:", err);
    }
    setSubmitting(false);
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim() || !hwDueDate) return;
    setSubmittingHw(true);
    try {
      await fetchApi("/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, title: hwTitle.trim(), description: hwDesc.trim(), subject: hwSubject, dueDate: hwDueDate }),
      });
      setHwTitle(""); setHwDesc(""); setHwDueDate("");
      await fetchHomeworks();
    } catch (err) {
      console.error("Homework submit failed:", err);
    }
    setSubmittingHw(false);
  };

  const handleMarkHomework = async (homeworkId: string, status: string, remarks?: string) => {
    try {
      await fetchApi("/homework", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeworkId, status, tutorRemarks: remarks }),
      });
      await fetchHomeworks();
    } catch (err) {
      console.error("Mark homework failed:", err);
    }
  };

  const handlePostComment = async (progressUpdateId: string) => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await fetchApi("/progress/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressUpdateId, comment: commentText.trim() }),
      });
      setCommentText("");
      setCommentingOnId(null);
      await fetchUpdates();
    } catch (err) {
      console.error("Comment failed:", err);
    }
    setSubmittingComment(false);
  };

  const handleEditUpdate = async (updateId: string) => {
    try {
      await fetchApi("/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId, action: "edit", title: editTitle, description: editDesc }),
      });
      setEditingId(null);
      await fetchUpdates();
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (!confirm("Delete this update?")) return;
    try {
      await fetchApi(`/progress?updateId=${updateId}`, { method: "DELETE" });
      await fetchUpdates();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Compute performance summary
  const avgRating = updates.filter((u) => u.rating).length > 0
    ? (updates.filter((u) => u.rating).reduce((sum: number, u: any) => sum + u.rating, 0) / updates.filter((u) => u.rating).length).toFixed(1)
    : "N/A";
  const attendanceCount = updates.filter((u) => u.type === "CLASS_NOTE" || u.type === "ATTENDANCE").length;
  const last7 = updates.filter((u) => u.rating && new Date(u.sessionDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const last30 = updates.filter((u) => u.rating && new Date(u.sessionDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const avg7 = last7.length > 0 ? (last7.reduce((s: number, u: any) => s + u.rating, 0) / last7.length).toFixed(1) : "N/A";
  const avg30 = last30.length > 0 ? (last30.reduce((s: number, u: any) => s + u.rating, 0) / last30.length).toFixed(1) : "N/A";


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full mr-2" />
        <span className="text-xs text-slate-400 font-mono">Loading progress...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800/60">
        {[
          { key: "updates", label: "Updates", badge: role === "PARENT" ? unseenCount : updates.length },
          { key: "homework", label: "Homework", badge: hwStats.assigned },
          { key: "summary", label: "Summary", badge: null },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer relative ${
              activeTab === tab.key
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            }`}
          >
            {tab.label}
            {tab.badge !== null && tab.badge > 0 && (
              <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold px-1 ${
                tab.key === "updates" && role === "PARENT" ? "bg-red-500 text-white" : "bg-slate-700 text-slate-300"
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* UPDATES TAB */}
      {activeTab === "updates" && (
        <div className="space-y-4">
          {/* Post Update Button (Tutor) */}
          {role === "TUTOR" && (
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-2.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition cursor-pointer"
            >
              {showForm ? "✕ Cancel" : "＋ Post Progress Update"}
            </button>
          )}

          {/* Post Update Form (Tutor) */}
          {role === "TUTOR" && showForm && (
            <form onSubmit={handleSubmitUpdate} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              {/* Type selector */}
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Update Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {UPDATE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFormType(t.value)}
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        formType === t.value
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1 font-bold">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Math Chapter 5 — Quadratic Equations"
                  required
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1 font-bold">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="What was covered today? How was the student's performance?"
                  required
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              {/* Date + Rating row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1 font-bold">Session Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1 font-bold">Performance Rating</label>
                  <StarRating rating={formRating} setRating={setFormRating} />
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1 font-bold">Attachments</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {formAttachments.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt="attachment" className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                      <button
                        type="button"
                        onClick={() => setFormAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label className="w-12 h-12 rounded-lg border border-dashed border-slate-700 flex items-center justify-center cursor-pointer hover:border-emerald-500/50 transition">
                    {uploading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    ) : (
                      <span className="text-slate-600 text-lg">+</span>
                    )}
                    <input type="file" accept="image/*,.pdf" onChange={handleUploadAttachment} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Optional Homework */}
              <div className="border-t border-slate-800/60 pt-3">
                <button
                  type="button"
                  onClick={() => setAddHomework(!addHomework)}
                  className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 cursor-pointer transition"
                >
                  {addHomework ? "✕ Remove Homework" : "📚 Also Assign Homework"}
                </button>
                {addHomework && (
                  <div className="mt-2 space-y-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3">
                    <input
                      type="text"
                      value={hwTitle}
                      onChange={(e) => setHwTitle(e.target.value)}
                      placeholder="Homework title..."
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition"
                    />
                    <textarea
                      value={hwDesc}
                      onChange={(e) => setHwDesc(e.target.value)}
                      placeholder="Instructions (optional)..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition resize-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={hwSubject}
                        onChange={(e) => setHwSubject(e.target.value)}
                        placeholder="Subject"
                        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition"
                      />
                      <input
                        type="date"
                        value={hwDueDate}
                        onChange={(e) => setHwDueDate(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 rounded-xl text-xs transition cursor-pointer border-none disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Update"}
              </button>
            </form>
          )}

          {/* Updates Timeline */}
          {updates.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-slate-500 text-xs font-mono italic">No progress updates yet.</p>
              {role === "TUTOR" && <p className="text-slate-600 text-[10px] font-mono">Post your first update above!</p>}
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {updates.map((update: any) => {
                const badge = getTypeBadge(update.type);
                const isEditable = role === "TUTOR" && update.tutorId && (Date.now() - new Date(update.createdAt).getTime()) < 24 * 60 * 60 * 1000;
                return (
                  <div key={update.id} className={`bg-slate-950/60 border rounded-2xl p-4 space-y-2.5 transition-all ${
                    !update.seen && role === "PARENT" ? "border-emerald-500/30 bg-emerald-500/[0.03]" : "border-slate-800/60"
                  }`}>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-slate-900 border-slate-700">
                          {badge.icon} {badge.label}
                        </span>
                        {!update.seen && role === "PARENT" && (
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white uppercase">New</span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-600 font-mono">{timeAgo(update.createdAt)}</span>
                    </div>

                    {/* Title + Content */}
                    {editingId === update.id ? (
                      <div className="space-y-2">
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-emerald-500/30 text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none transition" />
                        <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2}
                          className="w-full bg-slate-900 border border-emerald-500/30 text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none transition resize-none" />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleEditUpdate(update.id)}
                            className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg cursor-pointer transition hover:bg-emerald-500/20">Save</button>
                          <button type="button" onClick={() => setEditingId(null)}
                            className="text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg cursor-pointer transition hover:bg-slate-700">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-white leading-snug">{update.title}</p>
                        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{update.description}</p>
                      </>
                    )}

                    {/* Meta: date, rating */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] text-slate-600 font-mono">
                        📅 {new Date(update.sessionDate).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {update.rating && <StarRating rating={update.rating} readonly />}
                    </div>

                    {/* Attachments */}
                    {update.attachmentUrls?.length > 0 && (
                      <div className="flex gap-2 flex-wrap pt-1">
                        {update.attachmentUrls.map((url: string, idx: number) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="attachment" className="w-16 h-16 rounded-lg object-cover border border-slate-700 hover:border-emerald-500/50 transition" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Tutor Actions */}
                    {isEditable && editingId !== update.id && (
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => { setEditingId(update.id); setEditTitle(update.title); setEditDesc(update.description); }}
                          className="text-[9px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer transition">✏️ Edit</button>
                        <button type="button" onClick={() => handleDeleteUpdate(update.id)}
                          className="text-[9px] font-mono text-red-500/60 hover:text-red-400 cursor-pointer transition">🗑️ Delete</button>
                      </div>
                    )}

                    {/* Comments */}
                    {update.comments?.length > 0 && (
                      <div className="border-t border-slate-800/40 pt-2 space-y-1.5">
                        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider font-bold">Guardian Feedback</span>
                        {update.comments.map((c: any) => (
                          <div key={c.id} className="bg-slate-900/40 rounded-lg px-3 py-2 text-[11px] text-slate-300">
                            <span className="font-bold text-slate-200">{c.guardian?.name || "Parent"}: </span>
                            {c.comment}
                            <span className="text-[9px] text-slate-600 ml-2 font-mono">{timeAgo(c.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Input (Parent) */}
                    {role === "PARENT" && (
                      <>
                        {commentingOnId === update.id ? (
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Write a reply..."
                              className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 transition"
                              onKeyDown={(e) => { if (e.key === "Enter") handlePostComment(update.id); }}
                            />
                            <button type="button" onClick={() => handlePostComment(update.id)} disabled={submittingComment}
                              className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-3 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition hover:bg-emerald-500/25 disabled:opacity-50">
                              {submittingComment ? "..." : "Send"}
                            </button>
                            <button type="button" onClick={() => { setCommentingOnId(null); setCommentText(""); }}
                              className="text-slate-500 hover:text-slate-300 text-[10px] cursor-pointer px-2">✕</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setCommentingOnId(update.id)}
                            className="text-[10px] font-mono text-slate-600 hover:text-emerald-400 cursor-pointer transition pt-1">
                            💬 Reply
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* HOMEWORK TAB */}
      {activeTab === "homework" && (
        <div className="space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Total", val: hwStats.total, cls: "text-slate-300" },
              { label: "Pending", val: hwStats.assigned, cls: "text-amber-400" },
              { label: "Done", val: hwStats.completed, cls: "text-emerald-400" },
              { label: "Overdue", val: hwStats.overdue, cls: "text-red-400" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 text-center">
                <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider block font-bold">{s.label}</span>
                <span className={`text-lg font-extrabold font-mono block ${s.cls}`}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {hwStats.total > 0 && (
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${(hwStats.completed / hwStats.total) * 100}%` }}
              />
            </div>
          )}

          {/* Standalone Homework Form (Tutor) */}
          {role === "TUTOR" && (
            <form onSubmit={handleSubmitHomework} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 space-y-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">Assign Homework</span>
              <input type="text" value={hwTitle} onChange={(e) => setHwTitle(e.target.value)} placeholder="Homework title..." required
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition" />
              <textarea value={hwDesc} onChange={(e) => setHwDesc(e.target.value)} placeholder="Instructions..." rows={2}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={hwSubject} onChange={(e) => setHwSubject(e.target.value)} placeholder="Subject"
                  className="bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition" />
                <input type="date" value={hwDueDate} onChange={(e) => setHwDueDate(e.target.value)} required
                  className="bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition" />
              </div>
              <button type="submit" disabled={submittingHw}
                className="w-full bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/20 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer transition disabled:opacity-50">
                {submittingHw ? "Assigning..." : "Assign Homework"}
              </button>
            </form>
          )}

          {/* Homework List */}
          {homeworks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-xs font-mono italic">No homework assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {homeworks.map((hw: any) => (
                <div key={hw.id} className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{hw.title}</p>
                      {hw.description && <p className="text-[10px] text-slate-500 mt-0.5">{hw.description}</p>}
                    </div>
                    <span className={`shrink-0 text-[8px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                      hw.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" :
                      hw.status === "OVERDUE" ? "bg-red-500/10 text-red-400" :
                      hw.status === "CANCELLED" ? "bg-slate-500/10 text-slate-400" :
                      "bg-amber-500/10 text-amber-400"
                    }`}>
                      {hw.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-600">
                    <span>📖 {hw.subject}</span>
                    <span>Due: {new Date(hw.dueDate).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}</span>
                  </div>
                  {hw.tutorRemarks && (
                    <p className="text-[10px] text-slate-400 italic bg-slate-900/40 rounded-lg px-2.5 py-1.5">
                      Tutor: &ldquo;{hw.tutorRemarks}&rdquo;
                    </p>
                  )}
                  {/* Tutor actions */}
                  {role === "TUTOR" && hw.status === "ASSIGNED" && (
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => handleMarkHomework(hw.id, "COMPLETED")}
                        className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg cursor-pointer transition hover:bg-emerald-500/20">
                        ✓ Mark Complete
                      </button>
                      <button type="button" onClick={() => handleMarkHomework(hw.id, "CANCELLED")}
                        className="text-[9px] font-mono text-slate-500 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg cursor-pointer transition hover:bg-slate-700">
                        Cancel
                      </button>
                    </div>
                  )}
                  {role === "TUTOR" && hw.status === "OVERDUE" && (
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => handleMarkHomework(hw.id, "COMPLETED")}
                        className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg cursor-pointer transition hover:bg-emerald-500/20">
                        ✓ Mark Complete (Late)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUMMARY TAB */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          {/* Performance Overview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 text-center">
              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider block font-bold">Avg Rating</span>
              <span className="text-xl font-extrabold text-amber-400 font-mono block mt-1">{avgRating}</span>
              <span className="text-[8px] text-slate-600 font-mono">/ 5.0</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 text-center">
              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider block font-bold">Classes</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono block mt-1">{attendanceCount}</span>
              <span className="text-[8px] text-slate-600 font-mono">sessions</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 text-center">
              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider block font-bold">Updates</span>
              <span className="text-xl font-extrabold text-indigo-400 font-mono block mt-1">{updates.length}</span>
              <span className="text-[8px] text-slate-600 font-mono">total</span>
            </div>
          </div>

          {/* Trend Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider block font-bold">Last 7 Days</span>
              <span className="text-lg font-bold text-white font-mono mt-1 block">⭐ {avg7}</span>
              <span className="text-[9px] text-slate-600 font-mono">{last7.length} rated session(s)</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider block font-bold">Last 30 Days</span>
              <span className="text-lg font-bold text-white font-mono mt-1 block">⭐ {avg30}</span>
              <span className="text-[9px] text-slate-600 font-mono">{last30.length} rated session(s)</span>
            </div>
          </div>

          {/* Rating Trend SVG Chart */}
          {updates.filter((u) => u.rating).length > 1 && (() => {
            const rated = updates.filter((u) => u.rating).sort((a: any, b: any) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());
            const w = 300;
            const h = 80;
            const px = 10;
            const py = 10;
            const stepX = (w - 2 * px) / Math.max(rated.length - 1, 1);
            const points = rated.map((u: any, i: number) => ({
              x: px + i * stepX,
              y: py + (h - 2 * py) * (1 - (u.rating - 1) / 4),
            }));
            const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
            const area = `${line} L${points[points.length - 1].x},${h - py} L${points[0].x},${h - py} Z`;

            return (
              <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
                <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider block font-bold mb-2">Rating Trend</span>
                <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
                  <defs>
                    <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={area} fill="url(#ratingGrad)" />
                  <path d={line} fill="none" stroke="rgb(16,185,129)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="rgb(16,185,129)" stroke="rgb(15,23,42)" strokeWidth="1.5" />
                  ))}
                </svg>
              </div>
            );
          })()}

          {/* Homework Completion Summary */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
            <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider block font-bold mb-2">Homework Completion</span>
            {hwStats.total === 0 ? (
              <p className="text-[10px] text-slate-500 font-mono italic">No homework assigned yet.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">{hwStats.completed} / {hwStats.total} completed</span>
                  <span className="text-emerald-400 font-bold">{Math.round((hwStats.completed / hwStats.total) * 100)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(hwStats.completed / hwStats.total) * 100}%`,
                      background: "linear-gradient(90deg, rgb(16,185,129), rgb(52,211,153))",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Update Type Breakdown */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
            <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider block font-bold mb-2">Update Categories</span>
            <div className="space-y-1.5">
              {UPDATE_TYPES.map((t) => {
                const count = updates.filter((u) => u.type === t.value).length;
                return (
                  <div key={t.value} className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">{t.icon} {t.label}</span>
                    <span className="text-slate-300 font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
