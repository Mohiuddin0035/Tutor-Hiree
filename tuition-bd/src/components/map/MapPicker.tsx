"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import type * as LeafletType from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in Next.js
 
const L = typeof window !== "undefined" ? require("leaflet") : null;

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
    setTimeout(() => map.invalidateSize(), 150);
  }, [center, map]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    const container = map.getContainer();
    if (container) observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onChange: (coords: { lat: number; lng: number; actualLat?: number; actualLng?: number }) => void;
}

export default function MapPicker({ initialLat, initialLng, onChange }: MapPickerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([
    initialLat || 23.8103,
    initialLng || 90.4125,
  ]);
  const [actualPos, setActualPos] = useState<[number, number] | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const autoFetchedRef = useRef(false);

  useEffect(() => {
     
    setIsMounted(true);
    if (L) {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/marker-icon-2x.png",
        iconUrl: "/marker-icon.png",
        shadowUrl: "/marker-shadow.png",
      });
    }
  }, []);

  // Sync initialLat/initialLng changes
  useEffect(() => {
    if (initialLat && initialLng) {
       
      setMarkerPosition([initialLat, initialLng]);
    }
  }, [initialLat, initialLng]);

  // Auto fetch location on load if default coordinates are used (i.e. registration page init)
  useEffect(() => {
    if (autoFetchedRef.current) return;

    const isDefaultCoords = (!initialLat || initialLat === 23.8103) && (!initialLng || initialLng === 90.4125);
    if (isDefaultCoords && "geolocation" in navigator) {
      autoFetchedRef.current = true;
       
      setIsFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const fetchedLat = position.coords.latitude;
          const fetchedLng = position.coords.longitude;
          const newPos: [number, number] = [fetchedLat, fetchedLng];
          
          setMarkerPosition(newPos);
          setActualPos(newPos);
          setIsFetchingLocation(false);
          
          onChangeRef.current({
            lat: fetchedLat,
            lng: fetchedLng,
            actualLat: fetchedLat,
            actualLng: fetchedLng,
          });
        },
        (error) => {
          console.error("Error auto-fetching geolocation on map mount:", error);
          setIsFetchingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [initialLat, initialLng]);

  const markerRef = useRef<LeafletType.Marker | null>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          const newPos: [number, number] = [latLng.lat, latLng.lng];
          setMarkerPosition(newPos);
          onChangeRef.current({
            lat: latLng.lat,
            lng: latLng.lng,
            actualLat: actualPos ? actualPos[0] : undefined,
            actualLng: actualPos ? actualPos[1] : undefined,
          });
        }
      },
    }),
    [actualPos]
  );

  const handleAutoFetchLocation = () => {
    if ("geolocation" in navigator) {
      setIsFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const fetchedLat = position.coords.latitude;
          const fetchedLng = position.coords.longitude;
          const newPos: [number, number] = [fetchedLat, fetchedLng];
          
          setMarkerPosition(newPos);
          setActualPos(newPos);
          setIsFetchingLocation(false);
          
          onChangeRef.current({
            lat: fetchedLat,
            lng: fetchedLng,
            actualLat: fetchedLat,
            actualLng: fetchedLng,
          });
        },
        (error) => {
          console.error("Error fetching exact geolocation:", error);
          alert("Could not fetch location automatically. Please drag the map marker manually.");
          setIsFetchingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  if (!isMounted) {
    return (
      <div className="h-[220px] w-full bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center animate-pulse">
        <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full mr-2" />
        <span className="text-xs text-slate-400 font-mono">Initializing pick map...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          Selected Coordinates: <span className="text-emerald-400 font-bold ml-1">{markerPosition[0].toFixed(5)}, {markerPosition[1].toFixed(5)}</span>
        </span>
        <button
          type="button"
          onClick={handleAutoFetchLocation}
          disabled={isFetchingLocation}
          className="flex items-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFetchingLocation ? (
            <>
              <div className="animate-spin h-3 w-3 border-2 border-emerald-400 border-t-transparent rounded-full" />
              <span>Fetching GPS...</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>Auto Geolocation Fetch</span>
            </>
          )}
        </button>
      </div>

      <div className="h-[220px] w-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative z-0">
        <MapContainer
          center={markerPosition}
          zoom={14}
          scrollWheelZoom={true}
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={markerPosition}
            ref={markerRef}
          />
          <MapUpdater center={markerPosition} />
        </MapContainer>
      </div>
      <p className="text-[10px] text-slate-500 italic">
        * You can drag the pin to mark your exact tuition/residence coordinates manually.
      </p>
    </div>
  );
}
