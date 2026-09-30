"use client";
import { fetchApi } from "@/lib/api";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, CircleMarker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useSession } from "next-auth/react";
import L from "leaflet";

function RecenterControl({ userLocation }: { userLocation: [number, number] | null }) {
  const map = useMap();
  
  if (!userLocation) return null;

  return (
    <div className="absolute bottom-6 right-6 z-[1000] pointer-events-auto">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.setView(userLocation, 14, { animate: true });
        }}
        className="bg-slate-950/95 backdrop-blur-md hover:bg-slate-900 border border-slate-800 text-white px-3 py-2 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-400 group"
        title="Recenter to my location"
      >
        <svg
          className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition duration-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold">My Location</span>
      </button>
    </div>
  );
}

function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();
  useEffect(() => {
    onZoomChange(map.getZoom());
    const onZoom = () => {
      onZoomChange(map.getZoom());
    };
    map.on("zoomend", onZoom);
    return () => {
      map.off("zoomend", onZoom);
    };
  }, [map, onZoomChange]);
  return null;
}

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function AutoCenter({ userLocation }: { userLocation: [number, number] | null }) {
  const map = useMap();
  const [hasCentered, setHasCentered] = useState(false);
  useEffect(() => {
    if (userLocation && !hasCentered) {
      map.setView(userLocation, 14, { animate: true });
      setHasCentered(true);
    }
  }, [userLocation, map, hasCentered]);
  return null;
}

function MapClickHandler({ 
  setUserLocation, 
  setSearchRadius,
  userLocation,
  searchRadius
}: { 
  setUserLocation: (loc: [number, number]) => void; 
  setSearchRadius: (r: 1.5 | 3 | 5) => void; 
  userLocation: [number, number] | null;
  searchRadius: number;
}) {
  const map = useMapEvents({
    click(e) {
      // Radius is locked. Do not change user location or radius on map click.
    },
  });
  return null;
}

export default function MapComponent({
  type,
  subjects,
  classLevels,
  searchRadius,
  setSearchRadius,
  onMetricsChange,
}: {
  type: string;
  subjects: string[];
  classLevels: string[];
  searchRadius: 1.5 | 3 | 5;
  setSearchRadius: (r: 1.5 | 3 | 5) => void;
  onMetricsChange?: (metrics: { total: number; within: number; outside: number }) => void;
}) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || "";
  const userRole = (session?.user as any)?.role || "";

  const [isMounted, setIsMounted] = useState(false);
  const [dbJobs, setDbJobs] = useState<any[]>([]);
  const [dbTutors, setDbTutors] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [payLaterJob, setPayLaterJob] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(14);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activePostsCount, setActivePostsCount] = useState<number | null>(null);
  const [tutorGender, setTutorGender] = useState<string | null>(null);

  const [myActiveJobs, setMyActiveJobs] = useState<any[]>([]);
  const [requestingJobId, setRequestingJobId] = useState<string>("");
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [requestSuccess, setRequestSuccess] = useState<string>("");

  useEffect(() => {
    if (session && userRole === "PARENT") {
      fetchApi(`/jobs?parentId=${(session.user as any)?.id}`)
        .then((data) => {
          if (Array.isArray(data)) {
            const activeJobs = data.filter((j: any) => j.status === "OPEN");
            setActivePostsCount(activeJobs.length);
            setMyActiveJobs(activeJobs);
          } else {
            setActivePostsCount(0);
            setMyActiveJobs([]);
          }
        })
        .catch(() => {
          setActivePostsCount(0);
          setMyActiveJobs([]);
        });
    }
  }, [session, userRole]);

  useEffect(() => {
    if (session && userRole === "TUTOR") {
      fetchApi("/profile")
        .then((data) => {
          if (data && data.gender) {
            setTutorGender(data.gender);
          }
        })
        .catch(() => {});
    }
  }, [session, userRole]);

  const handleRequestTutor = async (tutorId: string) => {
    if (!requestingJobId) {
      alert("Please select one of your tuition posts to request the tutor.");
      return;
    }
    setIsRequesting(true);
    setRequestSuccess("");
    try {
      await fetchApi("/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: requestingJobId,
          tutorId,
          action: "request"
        })
      });
      setRequestSuccess("Request sent successfully to tutor!");
      // Clear active jobs list of this job by removing it
      setMyActiveJobs((prev) => prev.filter((j) => j.id !== requestingJobId));
      setActivePostsCount((prev) => (prev ? prev - 1 : 0));
      setRequestingJobId("");
    } catch (e) {
      alert("Error sending request.");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleItemClick = (item: any) => {
    setRequestSuccess("");
    setRequestingJobId("");
    if (type === "tutor") {
      if (session && userRole === "PARENT" && activePostsCount === 0) {
        alert("You currently have no active tuition posts.");
        return;
      }
    }
    setSelectedItem(item);
  };

  const handleApply = async (jobId: string) => {
    if (!session) {
      alert("Please login first to apply for jobs.");
      return;
    }
    setApplyingJobId(jobId);
    try {
      await fetchApi("/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action: "apply" }),
      });
      alert("✓ Applied successfully! Check your tutor dashboard assigned section.");
    } catch (e) {
      console.error(e);
      alert("Error applying for job.");
    } finally {
      setApplyingJobId(null);
    }
  };

  // Initialize client geolocation coordinates
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("GPS access blocked or unavailable, centering on central Bangladesh coordinates.", error);
          setUserLocation([23.8103, 90.4125]);
        }
      );
    } else {
      setUserLocation([23.8103, 90.4125]);
    }
  }, []);

  // Fix Leaflet marker icons in Next.js
  useEffect(() => {
    setIsMounted(true);
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/marker-icon-2x.png",
      iconUrl: "/marker-icon.png",
      shadowUrl: "/marker-shadow.png",
    });
  }, []);

  // Fetch data on filters change
  useEffect(() => {
    if (!isMounted) return;

    if (type !== "tutor") {
      fetchApi(`/jobs?t=${Date.now()}`)
        .then((data) => {
          const mappedJobs = data.map((job: any) => ({
            ...job,
            approxLat: job.approxLatitude || (job.latitude + (Math.random() * 0.005 - 0.0025)),
            approxLng: job.approxLongitude || (job.longitude + (Math.random() * 0.005 - 0.0025))
          }));
          setDbJobs(mappedJobs);
        })
        .catch((err) => console.warn(err));
    } else {
      fetchApi("/users?role=TUTOR")
        .then((data) => {
          const mapTutors = data
            .filter((u: any) => u.profile && u.profile.is_active !== false && u.profile.verificationStatus === "VERIFIED")
            .map((u: any) => {
              const reviews = u.receivedReviews || [];
              const confirmedCount = u.appliedJobs?.length || 0;
              const hasConfirmedTuition = confirmedCount > 0 || reviews.length > 0;
              const avgRating = reviews.length > 0
                ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)
                : "0.0";

              return {
                id: u.id,
                name: u.name,
                approxLat: u.profile.approxLatitude || 23.734,
                approxLng: u.profile.approxLongitude || 90.3928,
                verified: u.profile.verificationStatus === "VERIFIED",
                subject: u.profile.bio || "Various Subjects",
                education: u.profile.education || "Dhaka University",
                gender: u.profile.gender || "Male",
                preferableTime: u.profile.preferableTime || "Available All Day",
                hasConfirmedTuition,
                avgRating,
                reviews,
                tutorSeq: u.profile.tutorSeq,
              };
            });
          
          // Fallback mockup tutor if SQLite database user table doesn't have tutors yet
          if (mapTutors.length === 0) {
            setDbTutors([
              {
                id: "mock1",
                name: "Rahim (DU Physics Major)",
                approxLat: 23.734,
                approxLng: 90.3928,
                verified: true,
                subject: "Physics, Advanced Mathematics",
                education: "Dhaka University",
                gender: "Male",
                preferableTime: "Evening (4:00 PM - 8:00 PM)",
                tutorSeq: 1,
              },
              {
                id: "mock2",
                name: "Nusrat (NSU English Dept)",
                approxLat: 23.7925,
                approxLng: 90.4078,
                verified: false,
                subject: "English Literature, IELTS Preparation",
                education: "North South University",
                gender: "Female",
                preferableTime: "Available All Day",
                tutorSeq: 2,
              },
            ]);
          } else {
            setDbTutors(mapTutors);
          }
        })
        .catch((err) => {
          console.warn(err);
          setDbTutors([
            {
              id: "mock1",
              name: "Rahim (DU Physics Major)",
              approxLat: 23.734,
              approxLng: 90.3928,
              verified: true,
              subject: "Physics, Advanced Mathematics",
              education: "Dhaka University",
              gender: "Male",
              preferableTime: "Evening (4:00 PM - 8:00 PM)",
              tutorSeq: 1,
            },
            {
              id: "mock2",
              name: "Nusrat (NSU English Dept)",
              approxLat: 23.7925,
              approxLng: 90.4078,
              verified: false,
              subject: "English Literature, IELTS Preparation",
              education: "North South University",
              gender: "Female",
              preferableTime: "Available All Day",
              tutorSeq: 2,
            },
          ]);
        });
    }
  }, [type, isMounted]);

  // Sync calculated proximity metrics back to parent dashboard outside-of-map controls.
  // Calculated at top level so that it runs unconditionally (no Rules of Hooks violations!).
  useEffect(() => {
    if (!onMetricsChange) return;

    let items = type === "tutor" ? dbTutors : dbJobs;
    if (type !== "tutor") {
      items = items.filter((job: any) => !job.locationUnlocked && job.status === "OPEN");
    }

    if (subjects && subjects.length > 0) {
      items = items.filter((item: any) => {
        const itemSubject = (item.subject || item.bio || "").toLowerCase();
        return subjects.some((sub) => itemSubject.includes(sub.toLowerCase()));
      });
    }

    if (classLevels && classLevels.length > 0) {
      items = items.filter((item: any) => {
        const itemClass = (item.classLevel || item.education || "").toLowerCase();
        return classLevels.some((cl) => {
          const queryCl = cl.toLowerCase();
          if (queryCl === "o level") {
            return itemClass.includes("o level") || itemClass.includes("o-level") || itemClass.includes("english medium");
          }
          if (queryCl === "a level") {
            return itemClass.includes("a level") || itemClass.includes("a-level") || itemClass.includes("english medium");
          }
          return itemClass.includes(queryCl);
        });
      });
    }

    const within = items.filter((item: any) => {
      return userLocation
        ? getDistanceInKm(userLocation[0], userLocation[1], item.approxLat, item.approxLng) <= searchRadius
        : true;
    }).length;

    onMetricsChange({
      total: items.length,
      within,
      outside: items.length - within,
    });
  }, [
    dbTutors,
    dbJobs,
    type,
    subjects,
    classLevels,
    userLocation,
    searchRadius,
    onMetricsChange
  ]);

  if (!isMounted) {
    return (
      <div className="h-[750px] lg:h-[800px] w-full bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        <p className="text-slate-400 font-mono text-xs uppercase tracking-wider">Syncing map coordinates...</p>
      </div>
    );
  }

  const center: [number, number] = [23.8103, 90.4125]; // Central Bangladesh Center

  // Filter coordinates based on proximity range and unlock status
  let filteredItems = type === "tutor" ? dbTutors : dbJobs;
  
  // Ensure we only render items with valid coordinates
  filteredItems = filteredItems.filter((item: any) => item.approxLat != null && item.approxLng != null);

  if (type !== "tutor") {
    // Immediate coordinates vanish: hide if unlocked or status is not open
    filteredItems = filteredItems.filter((job: any) => !job.locationUnlocked && job.status === "OPEN");
  }

  // Apply checkbox subject filters
  if (subjects && subjects.length > 0) {
    filteredItems = filteredItems.filter((item: any) => {
      const itemSubject = (item.subject || item.bio || "").toLowerCase();
      return subjects.some((sub) => itemSubject.includes(sub.toLowerCase()));
    });
  }

  // Apply checkbox class level filters
  if (classLevels && classLevels.length > 0) {
    filteredItems = filteredItems.filter((item: any) => {
      const itemClass = (item.classLevel || item.education || "").toLowerCase();
      return classLevels.some((cl) => {
        const queryCl = cl.toLowerCase();
        if (queryCl === "o level") {
          return itemClass.includes("o level") || itemClass.includes("o-level") || itemClass.includes("english medium");
        }
        if (queryCl === "a level") {
          return itemClass.includes("a level") || itemClass.includes("a-level") || itemClass.includes("english medium");
        }
        return itemClass.includes(queryCl);
      });
    });
  }

  // Removed Strict 5km max distance filter so all pins are visible

  const withinProximityCount = filteredItems.filter((item: any) => {
    return userLocation
      ? getDistanceInKm(userLocation[0], userLocation[1], item.approxLat, item.approxLng) <= searchRadius
      : true;
  }).length;

  const outOfProximityCount = filteredItems.length - withinProximityCount;

  const isGenderMismatch =
    selectedItem &&
    type !== "tutor" &&
    selectedItem.parent?.tutorGenderPreference === "Female" &&
    tutorGender === "Male";

  return (
    <div className="h-[450px] sm:h-[600px] lg:h-[800px] w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative z-0">

      <MapContainer
        center={userLocation || center}
        zoom={14}
        scrollWheelZoom={true}
        attributionControl={false}
        preferCanvas={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterControl userLocation={userLocation} />
        <ZoomTracker onZoomChange={setZoomLevel} />
        <MapClickHandler setUserLocation={setUserLocation} setSearchRadius={setSearchRadius} userLocation={userLocation} searchRadius={searchRadius} />
        <AutoCenter userLocation={userLocation} />

        {userLocation && (
          <>
            {/* Dynamic Horizon Circle */}
            <Circle
              center={userLocation}
              radius={searchRadius * 1000} // Dynamic search radius in meters
              interactive={false}
              pathOptions={{
                color: "#0d9488",
                fillColor: "#14b8a6",
                fillOpacity: 0.12,
                weight: 3,
                dashArray: "10 10",
              }}
            />
          </>
        )}        {filteredItems.map((item: any) => {
          const isTutor = type === "tutor";
          const themeColor = isTutor ? "#14b8a6" : "#2dd4bf"; // Teal/Cyan theme colors

          const customIcon = L ? L.divIcon({
            className: "custom-map-pin",
            html: `
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 border-2 ${
                isTutor ? "border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(var(--theme-rgb),0.6)]" : "border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
              }">
                ${isTutor ? `
                  <svg class="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                ` : `
                  <svg class="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .414-.336.75-.75.75H4.5a.75.75 0 01-.75-.75v-4.25m16.5 0a3 3 0 00-3-3H7.05a3 3 0 00-3 3m16.5 0V9a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9v5.15" />
                  </svg>
                `}
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          }) : undefined;

          if (customIcon) {
            return (
              <Marker
                key={item.id}
                position={[item.approxLat, item.approxLng]}
                icon={customIcon}
                eventHandlers={{
                  click: () => handleItemClick(item)
                }}
              />
            );
          }

          // Fallback if customIcon is undefined
          return (
            <CircleMarker
              key={item.id}
              center={[item.approxLat, item.approxLng]}
              radius={8}
              pathOptions={{
                color: themeColor,
                fillColor: themeColor,
                fillOpacity: 0.8,
                weight: 2,
              }}
              eventHandlers={{
                click: () => handleItemClick(item)
              }}
            />
          );
        })}
      </MapContainer>

      {/* Side Drawer (Desktop) */}
      {selectedItem && (
        <div className="hidden md:flex absolute right-4 top-4 bottom-4 w-[350px] bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl p-5 z-[1000] flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 animate-slideInRight overflow-y-auto custom-scrollbar">
          {(!session || !userLocation || getDistanceInKm(userLocation[0], userLocation[1], selectedItem.approxLat, selectedItem.approxLng) > 5) ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <button onClick={() => setSelectedItem(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white transition cursor-pointer bg-transparent border-none">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl mb-2">
                🔒
              </div>
              <h3 className="text-white font-bold text-lg font-heading">Area Restricted</h3>
              <p className="text-slate-400 text-xs leading-relaxed px-4">
                You must be logged in and located within 5km of this pin to view the contact details and apply.
              </p>
              {!session && (
                <Link href="/login">
                  <button className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs transition duration-200 cursor-pointer border-none">
                    Log in
                  </button>
                </Link>
              )}
            </div>
          ) : type === "tutor" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-extrabold">
                  TC-{String(selectedItem.tutorSeq && selectedItem.tutorSeq > 0 ? selectedItem.tutorSeq : 1).padStart(3, '0')}
                </span>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white transition cursor-pointer bg-transparent border-none">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h3 className="text-sm font-bold font-heading text-white">{selectedItem.name || 'Tutor Profile'}</h3>
              <div className="h-px bg-slate-800" />
              <div className="space-y-4 text-xs">
                <div className="flex flex-col gap-1 bg-slate-900/50 border border-slate-850 p-3 rounded-xl">
                  <span className="text-slate-500 text-[10px] uppercase font-mono tracking-wider">University</span>
                  <span className="text-white font-sans text-sm font-semibold">
                    {selectedItem.education}
                  </span>
                </div>
                <div className="flex flex-col gap-1 bg-slate-900/50 border border-slate-850 p-3 rounded-xl">
                  <span className="text-slate-500 text-[10px] uppercase font-mono tracking-wider">Subject</span>
                  <span className="text-white font-sans text-sm font-semibold">
                    {selectedItem.subject}
                  </span>
                </div>
                <div className="flex flex-col gap-1 bg-slate-900/50 border border-slate-850 p-3 rounded-xl">
                  <span className="text-slate-500 text-[10px] uppercase font-mono tracking-wider">Preferable Time</span>
                  <span className="text-emerald-400 font-sans text-sm font-semibold">
                    {selectedItem.preferableTime}
                  </span>
                </div>
                <div className="flex flex-col gap-1 bg-slate-900/50 border border-slate-850 p-3 rounded-xl">
                  <span className="text-slate-500 text-[10px] uppercase font-mono tracking-wider">Gender</span>
                  <span className="text-white font-sans text-sm font-semibold">
                    {selectedItem.gender}
                  </span>
                </div>
              </div>
              {selectedItem.bio && (
                <div className="flex flex-col gap-1 bg-slate-900/50 border border-slate-850 p-3 rounded-xl">
                  <span className="text-slate-500 text-[10px] uppercase font-mono tracking-wider">Bio</span>
                  <span className="text-slate-300 font-sans text-xs italic">
                    &quot;{selectedItem.bio}&quot;
                  </span>
                </div>
              )}
              {userRole === "PARENT" && (
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl text-amber-400 font-mono text-[11px] leading-relaxed text-center font-semibold mb-3">
                    📞 Phone hidden. Request this tutor to unlock full contact details.
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Direct Tutor Request</span>
                  {requestSuccess ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-center font-mono text-[10px] text-emerald-400 font-extrabold">
                      {requestSuccess}
                    </div>
                  ) : myActiveJobs.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-850 p-2.5 rounded-lg text-[9px] font-mono text-slate-500 text-center">
                      No active open jobs available to assign.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={requestingJobId}
                        onChange={(e) => setRequestingJobId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/80 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none transition cursor-pointer"
                      >
                        <option value="">-- Select Active Job --</option>
                        {myActiveJobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            TCT-{String(j.jobSeq).padStart(3, '0')} - {j.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRequestTutor(selectedItem.id)}
                        disabled={isRequesting || !requestingJobId}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs transition duration-200 cursor-pointer border-none flex items-center justify-center"
                      >
                        {isRequesting ? "Sending Request..." : "Request Tutor"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-extrabold">
                  TCT-{String(selectedItem.jobSeq && selectedItem.jobSeq > 0 ? selectedItem.jobSeq : 1).padStart(3, '0')}
                </span>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white transition cursor-pointer bg-transparent border-none">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h3 className="text-sm font-bold font-heading text-white">{selectedItem.title}</h3>
              <div className="h-px bg-slate-800" />
              <div className="space-y-3 font-mono text-xs text-slate-300">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Class</span>
                  <span className="text-white font-sans text-sm font-semibold">{selectedItem.classLevel}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Time</span>
                  <span className="text-white font-sans text-sm font-semibold">{selectedItem.parent?.profile?.preferableTime || "Flexible"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Salary</span>
                  <span className="text-emerald-400 font-sans text-sm font-bold">{selectedItem.salary} BDT</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Duration</span>
                  <span className="text-white font-sans text-sm font-semibold">{selectedItem.duration || selectedItem.parent?.profile?.hoursRequired || "Not Specified"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Student Gender</span>
                  <span className="text-white font-sans text-sm font-semibold">{selectedItem.studentGender || selectedItem.parent?.profile?.gender || "Not Specified"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Students</span>
                  <span className="text-white font-sans text-sm font-semibold">{selectedItem.parent?.profile?.numberOfChildren || "1"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Tutor Requirement</span>
                  <span className="text-white font-sans text-sm font-semibold text-right max-w-[180px] truncate">{selectedItem.tutorRequirement || "Any University / Department"}</span>
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl text-amber-400 font-mono text-[11px] leading-relaxed text-center font-semibold">
                To get full details, please call us at 096-96-847-847.
              </div>

              <div className="pt-2">
                {selectedItem.tutorId === userId ? (
                  <div className="space-y-2">
                    {selectedItem.locationUnlocked ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-center font-mono text-[10px] text-emerald-400 font-extrabold flex items-center justify-center gap-1.5">
                        Verified Match Unlocked!
                      </div>
                    ) : (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-center font-mono text-[10px] text-amber-400 font-extrabold">
                        Application received! Awaiting parent approval.
                      </div>
                    )}
                  </div>
                ) : selectedItem.tutorId !== null ? (
                  <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-center font-mono text-[10px] text-red-400 font-extrabold">
                    ✗ Tuition Match Assigned (Closed)
                  </div>
                ) : isGenderMismatch ? (
                  <button
                    disabled={true}
                    className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2.5 rounded-xl text-xs font-bold w-full cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    Gender Mismatch (Requires Female Tutor)
                  </button>
                ) : userRole === "TUTOR" ? (
                  <button
                    onClick={() => handleApply(selectedItem.id)}
                    disabled={applyingJobId === selectedItem.id}
                    className="bg-emerald-500 text-slate-950 px-3 py-2.5 rounded-xl text-xs font-bold w-full hover:bg-emerald-600 transition duration-200 cursor-pointer border-none flex items-center justify-center gap-1.5"
                  >
                    {applyingJobId === selectedItem.id ? "Applying..." : `Apply for Tuition (৳${Math.ceil(selectedItem.salary * 0.10)} commission)`}
                  </button>
                ) : !session ? (
                  <Link href="/login" className="block w-full">
                    <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2.5 rounded-xl text-xs font-bold w-full transition duration-200 cursor-pointer border-none flex items-center justify-center">
                      Login as Tutor to Apply
                    </button>
                  </Link>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-center font-mono text-[9px] text-slate-500">
                    Available strictly for verified educators.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Sheet (Mobile) */}
      {selectedItem && (
        <div className="md:hidden absolute bottom-4 left-4 right-4 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl p-5 z-[1000] flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 animate-slideUp overflow-y-auto max-h-[320px] custom-scrollbar">
          {(!session || !userLocation || getDistanceInKm(userLocation[0], userLocation[1], selectedItem.approxLat, selectedItem.approxLng) > 5) ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <button onClick={() => setSelectedItem(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white transition cursor-pointer bg-transparent border-none">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mb-1">
                🔒
              </div>
              <h3 className="text-white font-bold text-base font-heading">Area Restricted</h3>
              <p className="text-slate-400 text-xs leading-relaxed px-2">
                You must be logged in and located within 5km to view details.
              </p>
              {!session && (
                <Link href="/login">
                  <button className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-5 rounded-lg text-[10px] transition duration-200 cursor-pointer border-none">
                    Log in
                  </button>
                </Link>
              )}
            </div>
          ) : type === "tutor" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-extrabold">
                  TC-{String(selectedItem.tutorSeq && selectedItem.tutorSeq > 0 ? selectedItem.tutorSeq : 1).padStart(3, '0')}
                </span>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white transition cursor-pointer bg-transparent border-none">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h3 className="text-xs font-bold font-heading text-white">{selectedItem.name || 'Tutor Profile'}</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-0.5 bg-slate-900/50 border border-slate-850 p-2.5 rounded-xl">
                  <span className="text-slate-500 text-[9px] uppercase font-mono tracking-wider">University</span>
                  <span className="text-white font-sans font-semibold truncate">{selectedItem.education}</span>
                </div>
                <div className="flex flex-col gap-0.5 bg-slate-900/50 border border-slate-850 p-2.5 rounded-xl">
                  <span className="text-slate-500 text-[9px] uppercase font-mono tracking-wider">Subject</span>
                  <span className="text-white font-sans font-semibold truncate">{selectedItem.subject}</span>
                </div>
                <div className="flex flex-col gap-0.5 bg-slate-900/50 border border-slate-850 p-2.5 rounded-xl">
                  <span className="text-slate-500 text-[9px] uppercase font-mono tracking-wider">Preferable Time</span>
                  <span className="text-emerald-400 font-sans font-semibold truncate">{selectedItem.preferableTime}</span>
                </div>
                <div className="flex flex-col gap-0.5 bg-slate-900/50 border border-slate-850 p-2.5 rounded-xl">
                  <span className="text-slate-500 text-[9px] uppercase font-mono tracking-wider">Gender</span>
                  <span className="text-white font-sans font-semibold truncate">{selectedItem.gender}</span>
                </div>
              </div>
              {userRole === "PARENT" && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-xl text-amber-400 font-mono text-[10px] leading-relaxed text-center font-semibold mb-2">
                    📞 Phone hidden. Request and pay 10% fee to unlock.
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Direct Tutor Request</span>
                  {requestSuccess ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-center font-mono text-[9px] text-emerald-400 font-extrabold">
                      {requestSuccess}
                    </div>
                  ) : myActiveJobs.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-lg text-[8px] font-mono text-slate-500 text-center">
                      No active open jobs available.
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={requestingJobId}
                        onChange={(e) => setRequestingJobId(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500/80 rounded-lg p-1.5 text-[10px] text-white placeholder-slate-600 focus:outline-none transition cursor-pointer"
                      >
                        <option value="">-- Select Job --</option>
                        {myActiveJobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            TCT-{String(j.jobSeq).padStart(3, '0')} - {j.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRequestTutor(selectedItem.userId)}
                        disabled={isRequesting || !requestingJobId}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-1.5 px-3 rounded-lg text-[10px] transition duration-200 cursor-pointer border-none shrink-0"
                      >
                        {isRequesting ? "..." : "Request"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-extrabold">
                  TCT-{String(selectedItem.jobSeq && selectedItem.jobSeq > 0 ? selectedItem.jobSeq : 1).padStart(3, '0')}
                </span>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white transition cursor-pointer bg-transparent border-none">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h3 className="text-xs font-bold text-white truncate">{selectedItem.title}</h3>
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-300">
                <div className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded-lg">
                  <span className="text-slate-500">Class:</span>
                  <span className="text-white font-sans truncate ml-1">{selectedItem.classLevel}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded-lg">
                  <span className="text-slate-500">Time:</span>
                  <span className="text-white font-sans truncate ml-1">{selectedItem.parent?.profile?.preferableTime || "Flexible"}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded-lg">
                  <span className="text-slate-500">Salary:</span>
                  <span className="text-emerald-400 font-sans font-bold truncate ml-1">{selectedItem.salary} BDT</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded-lg">
                  <span className="text-slate-500">Duration:</span>
                  <span className="text-white font-sans truncate ml-1">{selectedItem.duration || selectedItem.parent?.profile?.hoursRequired || "Not Specified"}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded-lg">
                  <span className="text-slate-500">Gender:</span>
                  <span className="text-white font-sans truncate ml-1">{selectedItem.studentGender || selectedItem.parent?.profile?.gender || "Not Specified"}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded-lg">
                  <span className="text-slate-500">Students:</span>
                  <span className="text-white font-sans truncate ml-1">{selectedItem.parent?.profile?.numberOfChildren || "1"}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded-lg col-span-2">
                  <span className="text-slate-500">Requirement:</span>
                  <span className="text-white font-sans truncate ml-1">{selectedItem.tutorRequirement || "Any University / Department"}</span>
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-xl text-amber-400 font-mono text-[10px] leading-relaxed text-center font-semibold mb-1">
                To get full details, please call us at 096-96-847-847.
              </div>

              <div className="pt-1">
                {selectedItem.tutorId === userId ? (
                  <div className="space-y-1.5">
                    {selectedItem.locationUnlocked ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-center font-mono text-[9px] text-emerald-400 font-extrabold">
                        Verified Match Unlocked!
                      </div>
                    ) : (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-center font-mono text-[9px] text-amber-400 font-extrabold">
                        Application received! Awaiting approval.
                      </div>
                    )}
                  </div>
                ) : selectedItem.tutorId !== null ? (
                  <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg text-center font-mono text-[9px] text-red-400 font-extrabold">
                    ✗ Closed
                  </div>
                ) : isGenderMismatch ? (
                  <button
                    disabled={true}
                    className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-bold w-full cursor-not-allowed flex items-center justify-center"
                  >
                    Gender Mismatch
                  </button>
                ) : userRole === "TUTOR" ? (
                  <button
                    onClick={() => handleApply(selectedItem.id)}
                    disabled={applyingJobId === selectedItem.id}
                    className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold w-full hover:bg-emerald-600 transition duration-200 cursor-pointer border-none flex items-center justify-center"
                  >
                    {applyingJobId === selectedItem.id ? "Applying..." : `Apply (৳${Math.ceil(selectedItem.salary * 0.10)} fee)`}
                  </button>
                ) : !session ? (
                  <Link href="/login" className="block w-full">
                    <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold w-full transition duration-200 cursor-pointer border-none">
                      Login as Tutor
                    </button>
                  </Link>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg text-center font-mono text-[8px] text-slate-500">
                    Verified educators only.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  );
}
