"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshAuth, isLoggedIn } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }): React.ReactNode {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function check() {
      if (isLoggedIn()) {
        setChecked(true);
        return;
      }
      // ลอง refresh — ถ้ามี refresh_token cookie จะได้ access token ใหม่
      const ok = await refreshAuth();
      if (ok) {
        setChecked(true);
      } else {
        router.replace("/login");
      }
    }
    check();
  }, [router]);

  if (!checked) return null;
  return <>{children}</>;
}
