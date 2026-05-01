"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

export interface LanguageOption {
  /** BCP 47 / ISO 639-1 code, e.g. "th", "en", "zh-CN". */
  code: string;
  nameEn: string;
  nameNative: string;
}

// Module-scope cache. The list rarely changes during a session — fetch
// once, share across pickers (trip wizard, future translation settings).
// Promise is cached too, so concurrent first-render mounts don't issue
// duplicate requests.
let cache: LanguageOption[] | null = null;
let inflight: Promise<LanguageOption[]> | null = null;

const FALLBACK: LanguageOption[] = [
  { code: "th", nameEn: "Thai", nameNative: "ไทย" },
  { code: "en", nameEn: "English", nameNative: "English" },
];

/**
 * Loads the active languages from /admin/languages on first mount.
 * Returns the fallback while loading and on failure so pickers always
 * have something selectable.
 */
export function useLanguages(): { languages: LanguageOption[]; loading: boolean } {
  const [languages, setLanguages] = useState<LanguageOption[]>(cache ?? FALLBACK);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    if (cache) return;
    if (!inflight) {
      inflight = api
        .get<{ code: string; nameEn: string; nameNative: string }[]>("/admin/languages")
        .then((rows) => {
          cache = rows;
          return rows;
        })
        .catch((err) => {
          inflight = null; // allow retry next mount
          throw err;
        });
    }
    let cancelled = false;
    inflight
      .then((rows) => {
        if (!cancelled) {
          setLanguages(rows);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoading(false);
        // Silent — fallback list is already in state.
        if (!(err instanceof ApiError)) console.warn("[useLanguages] fetch failed:", err);
      });
    return () => { cancelled = true; };
  }, []);

  return { languages, loading };
}
