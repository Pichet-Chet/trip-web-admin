"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface PlaceResult {
  placeName: string;
  lat: number;
  lng: number;
  mapsLink: string;
  imageUrl?: string;
}

interface Prediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

interface Props {
  value: string;
  apiKey: string | null;
  onPlaceSelect: (result: PlaceResult) => void;
  onTextChange: (text: string) => void;
  onBlur: () => void;
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.maps?.places) { resolve(); return; }
    const existing = document.getElementById("gmaps-script");
    if (existing) { existing.addEventListener("load", () => resolve()); return; }
    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=th`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export function PlaceAutocompleteInput({ value, apiKey, onPlaceSelect, onTextChange, onBlur }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ready, setReady] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  // Load Google Maps SDK
  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMaps(apiKey).then(() => setReady(true));
  }, [apiKey]);

  // Init services once ready
  useEffect(() => {
    if (!ready) return;
    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    // PlacesService needs a map or div element
    const div = document.createElement("div");
    placesServiceRef.current = new window.google.maps.places.PlacesService(div);
  }, [ready]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPredictions([]);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchPredictions = useCallback((input: string) => {
    if (!autocompleteServiceRef.current || input.length < 2) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    autocompleteServiceRef.current.getPlacePredictions(
      { input, language: "th" },
      (results, status) => {
        setLoading(false);
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) {
          setPredictions([]);
          setOpen(false);
          return;
        }
        setPredictions(results.map((r) => ({
          placeId: r.place_id,
          mainText: r.structured_formatting.main_text,
          secondaryText: r.structured_formatting.secondary_text ?? "",
          description: r.description,
        })));
        setOpen(true);
        setActiveIndex(-1);
      }
    );
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onTextChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 250);
  }

  function selectPrediction(pred: Prediction) {
    if (!placesServiceRef.current) return;
    onTextChange(pred.mainText);
    setOpen(false);
    setPredictions([]);

    placesServiceRef.current.getDetails(
      { placeId: pred.placeId, fields: ["name", "geometry", "url", "photos"] },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const photo = place.photos?.[0];
        onPlaceSelect({
          placeName: place.name ?? pred.mainText,
          lat,
          lng,
          mapsLink: place.url ?? `https://www.google.com/maps?q=${lat},${lng}`,
          imageUrl: photo ? photo.getUrl({ maxWidth: 800, maxHeight: 600 }) : undefined,
        });
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || predictions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectPrediction(predictions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setPredictions([]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-(--on-surface-variant) pointer-events-none select-none">
          location_on
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={() => { setTimeout(onBlur, 150); }}
          placeholder={apiKey ? "ค้นหาชื่อสถานที่..." : "ชื่อสถานที่ / สถานที่ตั้ง"}
          autoComplete="off"
          className="w-full pl-9 pr-8 py-2.5 bg-(--surface-variant)/30 border border-(--outline-variant)/40 rounded-xl text-sm text-(--on-surface) placeholder:text-(--on-surface-variant)/60 outline-none focus:border-(--primary) focus:bg-white transition-all"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="w-3.5 h-3.5 border-2 border-(--outline-variant) border-t-(--primary) rounded-full animate-spin block" />
          </span>
        )}
        {!loading && value && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onTextChange(""); setPredictions([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-(--on-surface-variant) hover:text-(--on-surface) transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {/* Custom Dropdown */}
      {open && predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-white rounded-xl border border-(--outline-variant)/30 shadow-xl overflow-hidden">
          <ul role="listbox" className="py-1 max-h-60 overflow-y-auto">
            {predictions.map((pred, i) => (
              <li
                key={pred.placeId}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => { e.preventDefault(); selectPrediction(pred); }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                  i === activeIndex ? "bg-(--primary-container)/40" : "hover:bg-(--surface-variant)/40"
                }`}
              >
                <span className="material-symbols-outlined text-sm text-(--on-surface-variant) mt-0.5 shrink-0">
                  location_on
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-(--on-surface) truncate">{pred.mainText}</p>
                  {pred.secondaryText && (
                    <p className="text-xs text-(--on-surface-variant) truncate">{pred.secondaryText}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {/* Required Google attribution */}
          <div className="px-4 py-1.5 border-t border-(--outline-variant)/20 flex justify-end">
            <span className="text-[10px] text-(--on-surface-variant)/50">powered by Google</span>
          </div>
        </div>
      )}
    </div>
  );
}
