"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface LanguageOption {
  /** BCP 47 / ISO 639-1 code, e.g. "th", "en", "zh-CN". */
  code: string;
  nameEn: string;
  nameNative: string;
  /** Unicode flag emoji (e.g. "🇹🇭"). May be null if the master row
      doesn't carry one — picker should treat it as optional. */
  flag: string | null;
}

// Module-scope cache. The list rarely changes during a session — fetch
// once, share across pickers (trip wizard, future translation settings).
// Promise is cached too, so concurrent first-render mounts don't issue
// duplicate requests.
let cache: LanguageOption[] | null = null;
let inflight: Promise<LanguageOption[]> | null = null;

const FALLBACK: LanguageOption[] = [
  { code: "th", nameEn: "Thai", nameNative: "ไทย", flag: "🇹🇭" },
  { code: "en", nameEn: "English", nameNative: "English", flag: "🇬🇧" },
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
        .get<{ code: string; nameEn: string; nameNative: string; flag: string | null }[]>("/admin/languages")
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
      .catch(() => {
        // Silent — the fallback list is already in state, so the UI
        // stays usable. A failed master-list fetch isn't actionable to
        // the operator and noisy logs aren't worth it.
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { languages, loading };
}
