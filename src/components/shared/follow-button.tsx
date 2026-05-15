"use client";

import { useState } from "react";

import { cn } from "@/lib/trip-utils";
import { FollowModal } from "@/components/shared/follow-modal";

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
        <span className="material-symbols-outlined text-sm">check</span>
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
        <span className="material-symbols-outlined text-sm">notifications</span>
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
