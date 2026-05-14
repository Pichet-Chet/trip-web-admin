"use client";

import { useEffect, useRef, useState } from "react";
import type { TripActivity } from "@/types";

interface Props {
  activities: TripActivity[];
  focusLat?: number | null;
  focusLng?: number | null;
  apiKey: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  attraction: "#0ea5e9",
  restaurant: "#f97316",
  hotel: "#6366f1",
  transport: "#64748b",
  shopping: "#ec4899",
  other: "#94a3b8",
};

const TYPE_LABELS: Record<string, string> = {
  attraction: "สถานที่", restaurant: "ร้านอาหาร", hotel: "ที่พัก",
  transport: "เดินทาง", shopping: "ช้อปปิ้ง", other: "อื่นๆ",
};

export function TripMapPanel({ activities, focusLat, focusLng, apiKey }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [noKey, setNoKey] = useState(false);

  // Wait for Google Maps to be ready (loaded by PlaceAutocompleteInput or here)
  useEffect(() => {
    if (!apiKey) { setNoKey(true); return; }

    const check = () => {
      if (window.google?.maps) { setReady(true); return; }
      setTimeout(check, 200);
    };

    if (window.google?.maps) { setReady(true); return; }

    const existing = document.getElementById("gmaps-script");
    if (existing) { check(); return; }

    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=th`;
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize map
  useEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 13.75, lng: 100.5 },
      zoom: 12,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
    });
  }, [ready]);

  // Sync markers whenever activities change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const withCoords = activities.filter((a) => a.lat && a.lng);
    if (withCoords.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    const infoWindow = new window.google.maps.InfoWindow();

    withCoords.forEach((act, i) => {
      const color = TYPE_COLORS[act.type] ?? TYPE_COLORS.other;
      const marker = new window.google.maps.Marker({
        position: { lat: act.lat!, lng: act.lng! },
        map: mapInstanceRef.current!,
        title: act.name,
        label: {
          text: String(i + 1),
          color: "#ffffff",
          fontWeight: "bold",
          fontSize: "12px",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => {
        infoWindow.setContent(`
          <div style="font-family:sans-serif;max-width:200px;padding:4px 0">
            <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:2px">${act.emoji ?? "📍"} ${act.name}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:4px">${TYPE_LABELS[act.type] ?? act.type}${act.time ? " · " + act.time : ""}</div>
            ${act.placeName ? `<div style="font-size:11px;color:#475569">${act.placeName}</div>` : ""}
            ${act.mapsLink ? `<a href="${act.mapsLink}" target="_blank" rel="noopener" style="font-size:11px;color:#2563eb;text-decoration:none">ดูใน Google Maps →</a>` : ""}
          </div>
        `);
        infoWindow.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: act.lat!, lng: act.lng! });
    });

    if (withCoords.length === 1) {
      mapInstanceRef.current.setCenter({ lat: withCoords[0].lat!, lng: withCoords[0].lng! });
      mapInstanceRef.current.setZoom(15);
    } else {
      mapInstanceRef.current.fitBounds(bounds, 48);
    }
  }, [activities, ready]);

  // Pan to focused pin (when user selects via autocomplete)
  useEffect(() => {
    if (!mapInstanceRef.current || !focusLat || !focusLng) return;
    mapInstanceRef.current.panTo({ lat: focusLat, lng: focusLng });
    mapInstanceRef.current.setZoom(16);
  }, [focusLat, focusLng]);

  if (noKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <span className="material-symbols-outlined text-4xl text-slate-300">map</span>
        <p className="text-sm font-semibold text-slate-500">ยังไม่ได้ตั้งค่า Google Maps API Key</p>
        <p className="text-xs text-slate-400">ไปที่ Staff → Settings → Integrations เพื่อใส่ Key</p>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden">
      {!ready && (
        <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-2xl">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
