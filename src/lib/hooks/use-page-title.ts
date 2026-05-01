"use client";

import { useEffect } from "react";

const APP_NAME = "Trip Admin";

/**
 * Sets `document.title` to "{title} | Trip Admin" while the component is mounted.
 * On unmount the title falls back to the app name so a stale per-page title
 * doesn't leak into the next route during transitions. Pass `null` to use just
 * the app name (root + impersonation pages).
 */
export function usePageTitle(title: string | null): void {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
    return () => { document.title = APP_NAME; };
  }, [title]);
}
