import { useEffect } from "react";

/**
 * Warn the user before they close the tab or navigate away with unsaved
 * form changes. Covers refresh, tab-close, and same-tab navigation to an
 * external URL via the browser's native `beforeunload` dialog.
 *
 * Note: this does NOT intercept Next.js client-side router navigation
 * (router.push / `<Link>` clicks). The app router has no stable hook for
 * that yet — guard those paths with explicit confirms at call sites.
 */
export function useUnsavedChanges(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
      // Modern browsers ignore the message but still show a generic dialog
      // when returnValue is set.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
