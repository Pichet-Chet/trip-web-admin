"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribe, refreshAuth, isLoggedIn, type UserInfo } from "@/lib/auth";

/**
 * Wraps operator-only pages. Redirects members to /dashboard.
 * Waits for auth to resolve before rendering children.
 */
export function OperatorGuard({ children }: { children: React.ReactNode }): React.ReactNode {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let resolved = false;

    async function check(user: UserInfo | null) {
      if (resolved) return;

      if (user !== null) {
        resolved = true;
        if (user.isOperator) {
          setState("ok");
        } else {
          setState("denied");
          router.replace("/dashboard");
        }
        return;
      }

      // user is null — might be initial state before refresh
      if (!isLoggedIn()) {
        const ok = await refreshAuth();
        if (!ok) {
          resolved = true;
          router.replace("/login");
        }
        // After refresh, subscribe fires again with the user — let it handle
      }
    }

    const unsub = subscribe((user) => { check(user); });
    return () => unsub();
  }, [router]);

  if (state === "loading") return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="text-(--outline) animate-pulse">กำลังโหลด...</div>
    </div>
  );

  if (state === "denied") return null;

  return <>{children}</>;
}
