"use client";

import { ToastProvider } from "@/components/shared";

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return <ToastProvider>{children}</ToastProvider>;
}
