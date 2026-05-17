"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchChangelog, fetchTripBySlug, fetchPendingChangelogs, type PendingChangelog } from "@/lib/trip-api";
import { FollowModal } from "./FollowModal";
import { AcknowledgeModal } from "./AcknowledgeModal";

interface Props {
  children: React.ReactNode;
  slug: string;
}

export default function TripClientLayout({ children, slug }: Props): React.JSX.Element {
  const pathname = usePathname();

  const [tripId, setTripId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [pending, setPending] = useState<PendingChangelog | null>(null);
  const [followerId, setFollowerId] = useState<string | null>(null);
  const [showAckModal, setShowAckModal] = useState(false);

  useEffect(() => {
    setIsFollowing(localStorage.getItem(`followed_${slug}`) === "1");

    fetchTripBySlug(slug)
      .then((t) => setTripId(t.id))
      .catch(() => {});

    fetchChangelog(slug)
      .then((logs) => setUnreadCount(logs.length))
      .catch(() => {});

    const storedFollowerId = localStorage.getItem(`follower_id_${slug}`) ?? undefined;
    if (storedFollowerId) setFollowerId(storedFollowerId);

    fetchPendingChangelogs(slug, storedFollowerId)
      .then((p) => {
        if (p.changelogs.length > 0) {
          setPending(p);
          setShowAckModal(true);
        }
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    function onOpenFollowModal() { setShowFollowModal(true); }
    function onTripFollowed() { setIsFollowing(true); setShowFollowModal(false); }
    window.addEventListener("open-follow-modal", onOpenFollowModal);
    window.addEventListener("trip-followed", onTripFollowed);
    return () => {
      window.removeEventListener("open-follow-modal", onOpenFollowModal);
      window.removeEventListener("trip-followed", onTripFollowed);
    };
  }, []);

  const isOverview  = pathname === `/t/${slug}`;
  const isChangelog = pathname === `/t/${slug}/changelog`;
  const isHelp      = pathname === `/t/${slug}/help`;

  function handleOverviewClick() {
    if (isOverview) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      {children}

      {/* ── Shared Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-1px_0_0_rgba(0,0,0,0.06),0_-8px_24px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-3 items-end pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 px-2">

          {/* Overview */}
          {isOverview ? (
            <button onClick={handleOverviewClick} className="flex flex-col items-center gap-0.5 relative pt-1">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-brand-blue" />
              <span className="material-symbols-outlined text-brand-blue text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
              <span className="text-[10px] font-bold text-brand-blue">Overview</span>
            </button>
          ) : (
            <Link href={`/t/${slug}`} className="flex flex-col items-center gap-0.5 pt-1">
              <span className="material-symbols-outlined text-slate-400 text-2xl">explore</span>
              <span className="text-[10px] font-medium text-slate-400">Overview</span>
            </Link>
          )}

          {/* Middle: Follow pill (not following) OR Updates tab (following) */}
          {isFollowing ? (
            <Link href={`/t/${slug}/changelog`} className="flex flex-col items-center gap-0.5 relative pt-1">
              {isChangelog && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-brand-blue" />}
              <div className="relative">
                <span
                  className={`material-symbols-outlined text-2xl ${isChangelog ? "text-brand-blue" : "text-slate-400"}`}
                  style={isChangelog ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >history</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${isChangelog ? "font-bold text-brand-blue" : "font-medium text-slate-400"}`}>Updates</span>
            </Link>
          ) : (
            <div className="flex flex-col items-center justify-end pb-0.5">
              <button
                onClick={() => setShowFollowModal(true)}
                className="gradient-silk text-white flex items-center gap-1.5 px-4 py-2 rounded-full shadow-lg shadow-brand-blue/25 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                <span className="text-xs font-bold">Follow</span>
              </button>
            </div>
          )}

          {/* Help */}
          {isHelp ? (
            <div className="flex flex-col items-center gap-0.5 relative pt-1">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-brand-blue" />
              <span className="material-symbols-outlined text-brand-blue text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>help_center</span>
              <span className="text-[10px] font-bold text-brand-blue">Help</span>
            </div>
          ) : (
            <Link href={`/t/${slug}/help`} className="flex flex-col items-center gap-0.5 pt-1">
              <span className="material-symbols-outlined text-slate-400 text-2xl">help_center</span>
              <span className="text-[10px] font-medium text-slate-400">Help</span>
            </Link>
          )}

        </div>
      </nav>

      {/* Follow Modal */}
      {showFollowModal && tripId && (
        <FollowModal tripId={tripId} slug={slug} onClose={() => setShowFollowModal(false)} />
      )}

      {/* Acknowledge Modal */}
      {showAckModal && pending && (
        <AcknowledgeModal
          slug={slug}
          followerId={followerId ?? undefined}
          pending={pending}
          onDone={() => setShowAckModal(false)}
        />
      )}
    </>
  );
}
