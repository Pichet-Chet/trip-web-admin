"use client";

import dynamic from "next/dynamic";
import type { MapActivity } from "./trip-day-map";

// Leaflet requires the browser DOM — never render on the server.
const TripDayMapInner = dynamic(
  () => import("./trip-day-map").then((m) => ({ default: m.TripDayMap })),
  { ssr: false, loading: () => <div className="w-full h-[280px] rounded-2xl bg-(--surface-variant) animate-pulse" /> }
);

export type { MapActivity };

interface TripDayMapLazyProps {
  activities: MapActivity[];
  height?: string;
}

export function TripDayMapLazy(props: TripDayMapLazyProps) {
  return <TripDayMapInner {...props} />;
}
