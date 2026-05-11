"use client";

import { useState } from "react";
// Inline SVG icons (lucide-react not available in trip-web-admin)
function Bell({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}
function Check({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
import { cn } from "@/lib/trip-utils";
import { FollowModal } from "@/components/client/shared/follow-modal";

type FollowButtonProps = {
  tripId: string;
  variant?: "hero" | "sticky";
  className?: string;
};

export function FollowButton({ tripId, variant = "hero", className }: FollowButtonProps): React.JSX.Element {
  const [isFollowed, setIsFollowed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleFollowSuccess(): void {
    setIsFollowed(true);
    setIsModalOpen(false);
  }

  if (isFollowed) {
    return (
      <button
        className={cn(
          "inline-flex items-center gap-2 rounded-full font-medium transition-all",
          variant === "hero"
            ? "bg-white/20 px-6 py-3 text-sm text-white backdrop-blur-sm"
            : "bg-success/10 px-4 py-2 text-xs text-success",
          className,
        )}
        disabled
      >
        <Check className="h-4 w-4" />
        ติดตามอยู่
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full font-bold shadow-lg transition-all hover:scale-105 active:scale-95",
          variant === "hero"
            ? "bg-primary px-6 py-3 text-sm text-white hover:bg-primary-dark"
            : "bg-primary px-4 py-2 text-xs text-white hover:bg-primary-dark",
          className,
        )}
      >
        <Bell className="h-4 w-4" />
        ติดตามทริปนี้
      </button>

      <FollowModal
        tripId={tripId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleFollowSuccess}
      />
    </>
  );
}
