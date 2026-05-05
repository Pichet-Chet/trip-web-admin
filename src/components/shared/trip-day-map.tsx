"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapActivity {
  name: string;
  lat: number;
  lng: number;
  time?: string | null;
}

interface TripDayMapProps {
  activities: MapActivity[];
  height?: string;
}

// Auto-fit bounds when activities change
function BoundsFitter({ positions }: { positions: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0] as [number, number], 14);
    } else {
      map.fitBounds(positions as [number, number][], { padding: [32, 32] });
    }
  }, [map, positions]);
  return null;
}

export function TripDayMap({ activities, height = "280px" }: TripDayMapProps) {
  const positions: LatLngExpression[] = activities.map((a) => [a.lat, a.lng]);
  const center: LatLngExpression = positions[0] ?? [13.75, 100.52];

  // Fix default Leaflet marker icon path broken by webpack
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  if (activities.length === 0) return null;

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden border border-(--outline-variant)/30">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <BoundsFitter positions={positions} />

        {activities.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{ color: "#2563eb", weight: 2.5, opacity: 0.7, dashArray: "6 4" }}
          />
        )}

        {activities.map((act, i) => (
          <Marker key={i} position={[act.lat, act.lng]}>
            <Popup>
              <div className="text-sm font-semibold">{act.name}</div>
              {act.time && <div className="text-xs text-gray-500 mt-0.5">{act.time}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
