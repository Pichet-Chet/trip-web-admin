"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { api, ApiError } from "@/lib/api";
import { TripStepperHeader } from "@/components/layout/trip-stepper";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { IconWrapper, FooterActionBar, QRCodeDisplay, Skeleton, ConfirmDialog, Banner, MobilePreview } from "@/components/shared";
import { useToast } from "@/components/shared";
import { useLanguages } from "@/lib/hooks/use-languages";
import { checkPublishReadiness, type PublishIssue } from "@/lib/validation/trip";
import { TripDayMapLazy, type MapActivity } from "@/components/shared";
import { resolveCoords } from "@/lib/parse-maps-link";
import { airportTimezone, utcOffsetLabel } from "@/lib/airport-timezone";

const isIataCode = (s: string | null | undefined): boolean => !!s && /^[A-Z]{3}$/.test(s.trim());
import { SubmitReviewModal } from "./_components/submit-review-modal";
import { CurrencyWidget } from "./_components/currency-widget";
import { EmergencyFab } from "./_components/emergency-fab";

/* ─── API types ─── */
interface TripDetail {
  id: string;
  title: string;
  slug: string | null;
  scope: string;
  visibility: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string | null;
  travelersCount: number;
  language: string;
  status: string;
  importantNotes: string | null;
  staffUnpublishReason: string | null;
  editCount: number;
  viewCount: number;
  followerCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  days: DayDetail[];
  airlineInfo: AirlineDetail[];
  accommodations: AccommodationDetail[];
  emergencyContacts: EmergencyDetail[];
  checklistItems?: ChecklistItem[];
  groupMembers?: { displayName: string; groupRole: string }[];
  pinnedAnnouncement?: {
    id: string;
    message: string;
    createdAt: string;
  } | null;
  lineGroupUrl?: string | null;
  whatsappGroupUrl?: string | null;
  telegramGroupUrl?: string | null;
  publishedQuotaSource: string | null;
  submittedAt: string | null;
  rejectionItems?: RejectionItem[];
  requiresApproval: boolean;
}

interface DayDetail {
  id: string;
  dayNumber: number;
  title: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  date: string | null;
  isFreeDay: boolean;
  sortOrder: number;
  activities: ActivityDetail[];
}

interface ActivityDetail {
  id: string;
  time: string | null;
  name: string;
  description: string | null;
  type: string;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  mapsLink: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
  emoji: string | null;
  sortOrder: number;
}

interface AirlineDetail {
  transportType: string;
  type: string;
  airline: string | null;
  flightNumber: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  departureDate: string | null;
  departureTime: string | null;
  arrivalDate: string | null;
  arrivalTime: string | null;
  bookingRef: string | null;
}

interface AccommodationDetail {
  name: string;
  address: string | null;
  phone: string | null;
}

interface EmergencyDetail {
  name: string;
  phone: string;
  icon: string | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  isRequired: boolean;
  sortOrder: number;
}

interface RejectionItem {
  id: string;
  itemId: string;
  itemLabel: string;
  reason: string;
  staffName: string;
  createdAt: string;
}

interface SubmitReviewResponse {
  status: string;
  visibility: string;
  message: string;
  submittedAt: string;
}

/* ─── Helpers ─── */
const CLIENT_BASE = process.env.NEXT_PUBLIC_CLIENT_URL || "https://trip.example.com";


function formatDateTH(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function formatDateFullTH(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

export default function TripPreviewPage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  usePageTitle(trip ? `ดูตัวอย่าง: ${trip.title}` : null);
  const [loading, setLoading] = useState(true);
  const { languages: availableLanguages } = useLanguages();
  const [supportedLangs, setSupportedLangs] = useState<string[]>([]);
  const [removingLang, setRemovingLang] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [visibility, setVisibility] = useState<"link_only" | "marketplace">("link_only");
  const [copied, setCopied] = useState(false);
  const [copiedLine, setCopiedLine] = useState(false);
  const [previewDay, setPreviewDay] = useState(0);
  const [username, setUsername] = useState("");
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [togglingApproval, setTogglingApproval] = useState(false);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);

  // Load username from auth
  useEffect(() => {
    (async () => {
      const { getUser } = await import("@/lib/auth");
      const user = getUser();
      if (user?.email) setUsername(user.email.split("@")[0].toLowerCase());
    })();
  }, []);

  const isPublished     = trip?.status === "Published";
  const isDraft         = trip?.status === "Draft";
  const isPendingReview = trip?.status === "PendingReview";
  const isUnpublished   = trip?.status === "Unpublished";
  const tripUrl = trip?.slug ? `${CLIENT_BASE}/t/${trip.slug}` : "";
  const totalDays = trip ? Math.max(1, Math.floor((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000) + 1) : 0;
  const totalActivities = trip?.days.reduce((s, d) => s + d.activities.length, 0) ?? 0;
  const countdown = trip ? daysUntil(trip.startDate) : 0;

  /* ─── Load trip + supported languages ─── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, suppResp, platform] = await Promise.all([
          api.get<TripDetail>(`/admin/trips/${id}`),
          api.get<{ languageCodes: string[] }>(`/admin/trips/${id}/translations/supported`).catch(() => ({ languageCodes: [] })),
          api.get<{ googleMapsApiKey?: string | null }>("/staff/platform").catch(() => null),
        ]);
        if (!cancelled) {
          setTrip(data);
          setSupportedLangs(suppResp.languageCodes ?? []);
          setRequiresApproval(data.requiresApproval ?? false);
          if (platform?.googleMapsApiKey) setGoogleMapsApiKey(platform.googleMapsApiKey);
        }
      } catch (err) {
        if (!cancelled) toast.error(err instanceof ApiError ? err.message : "ไม่สามารถโหลดข้อมูลทริปได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, toast]);

  /* ─── Submit for review ─── */
  const handleSubmitReview = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await api.post<SubmitReviewResponse>(`/admin/trips/${id}/publish`, { visibility });
      setTrip((prev) => prev ? { ...prev, status: "PendingReview" } : prev);
      setShowSubmitModal(false);
      toast.success(res.message || "ส่งตรวจสอบเรียบร้อย ทีมงานจะตรวจสอบและแจ้งผลโดยเร็ว");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ไม่สามารถส่งตรวจสอบได้");
    } finally {
      setSubmitting(false);
    }
  }, [id, visibility, toast]);

  /* ─── Cancel review ─── */
  const handleCancelReview = useCallback(async () => {
    setCancelling(true);
    try {
      await api.post(`/admin/trips/${id}/cancel-review`, {});
      setTrip((prev) => prev ? { ...prev, status: "Draft" } : prev);
      setShowCancelConfirm(false);
      toast.success("ยกเลิกการส่งตรวจสอบแล้ว");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ไม่สามารถยกเลิกได้");
    } finally {
      setCancelling(false);
    }
  }, [id, toast]);

  /* ─── Remove supported language ─── */
  const handleRemoveLang = useCallback(async (code: string) => {
    setRemovingLang(code);
    const updated = supportedLangs.filter((c) => c !== code);
    try {
      await api.put(`/admin/trips/${id}/translations/supported`, { languageCodes: updated });
      setSupportedLangs(updated);
      toast.success("ลบภาษาแล้ว");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ไม่สามารถลบภาษาได้");
    } finally {
      setRemovingLang(null);
    }
  }, [id, supportedLangs, toast]);

  /* ─── Unpublish ─── */
  const handleUnpublish = useCallback(async () => {
    setUnpublishing(true);
    try {
      await api.post(`/admin/trips/${id}/unpublish`, {});
      setTrip((prev) => prev ? { ...prev, status: "Unpublished" } : prev);
      setShowUnpublishConfirm(false);
      toast.success("ยกเลิกเผยแพร่แล้ว ลูกทริปจะไม่สามารถเข้าดูได้");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ไม่สามารถยกเลิกเผยแพร่ได้");
    } finally {
      setUnpublishing(false);
    }
  }, [id, toast]);

  /* ─── Copy link ─── */
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(tripUrl);
    setCopied(true);
    toast.success("คัดลอกลิงก์แล้ว");
    setTimeout(() => setCopied(false), 2000);
  }, [tripUrl, toast]);

  /* ─── Copy LINE message ─── */
  const copyLineMessage = useCallback(() => {
    const msg = `สวัสดีค่ะ 🙏\nทริป "${trip?.title}" พร้อมแล้วค่ะ\n\nเปิดดู itinerary ได้ที่:\n👉 ${tripUrl}\n\nกด "ติดตาม" เพื่อรับแจ้งเตือนเมื่อมีการเปลี่ยนแปลงค่ะ 🔔`;
    navigator.clipboard.writeText(msg);
    setCopiedLine(true);
    toast.success("คัดลอกข้อความ LINE แล้ว");
    setTimeout(() => setCopiedLine(false), 2000);
  }, [trip?.title, tripUrl, toast]);

  /* ─── Download ICS ─── */
  const downloadIcs = useCallback(async () => {
    try {
      const { getValidToken } = await import("@/lib/auth");
      const token = await getValidToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";
      const res = await fetch(`${apiUrl}/admin/trips/${id}/calendar.ics`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to generate ICS");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${trip?.slug ?? id}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("ดาวน์โหลดไฟล์ปฏิทินแล้ว");
    } catch {
      toast.error("ไม่สามารถสร้างไฟล์ปฏิทินได้");
    }
  }, [id, trip?.slug, toast]);

  /* ─── Download PDF ─── */
  const downloadPdf = useCallback(async () => {
    try {
      const { getValidToken } = await import("@/lib/auth");
      const token = await getValidToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";
      const res = await fetch(`${apiUrl}/admin/trips/${id}/export.pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${trip?.slug ?? id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("ดาวน์โหลด PDF แล้ว");
    } catch {
      toast.error("ไม่สามารถสร้าง PDF ได้");
    }
  }, [id, trip?.slug, toast]);

  /* ─── Download QR ─── */
  const downloadQR = useCallback(async () => {
    try {
      const QRCode = (await import("qrcode")).default;
      const dataUrl = await QRCode.toDataURL(tripUrl, { width: 1024, margin: 2, color: { dark: "#1e293b", light: "#ffffff" }, errorCorrectionLevel: "H" });
      // Filename: prefer trip title (sanitised) so the user can recognise
      // the file in Downloads. Strip filesystem-hostile chars; fall back
      // to slug or short id when the title is empty / non-Latin-only.
      const sanitised = (trip?.title ?? "")
        .replace(/[/\\?%*:|"<>]/g, "")
        .trim()
        .slice(0, 80);
      const filenameStem = sanitised || trip?.slug || id.slice(0, 8);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `qr-${filenameStem}.png`;
      a.click();
      toast.success("ดาวน์โหลด QR Code แล้ว");
    } catch {
      toast.error("ไม่สามารถสร้าง QR Code ได้");
    }
  }, [tripUrl, trip?.title, trip?.slug, id, toast]);

  /* ─── Validation check ─── */
  // Single source of truth (lib/validation/trip.ts) shared with the
  // wizard form so the rules can't drift between create and publish.
  const issues: PublishIssue[] = trip
    ? checkPublishReadiness({
        title: trip.title,
        destination: trip.destination,
        coverImageUrl: trip.coverImageUrl,
        scope: trip.scope,
        startDate: trip.startDate,
        endDate: trip.endDate,
        totalDays,
        totalActivities,
        daysCount: trip.days.length,
        // Free days are intentional empty — exclude them from the
        // empty-day count so the publish-gate doesn't block on them.
        daysWithoutActivity: trip.days.filter((d) => d.activities.length === 0 && !d.isFreeDay).length,
        freeDaysCount: trip.days.filter((d) => d.isFreeDay).length,
        hasOutboundTransport: trip.airlineInfo.some(
          (a) => a.type === "departure" && (a.airline || a.departureAirport),
        ),
        hasReturnTransport: trip.airlineInfo.some(
          (a) => a.type === "return" && (a.airline || a.departureAirport),
        ),
      })
    : [];

  /* ─── Join approval toggle ─── */
  const handleToggleApproval = useCallback(async () => {
    if (togglingApproval) return;
    const next = !requiresApproval;
    setRequiresApproval(next);
    setTogglingApproval(true);
    try {
      await api.put(`/admin/trips/${id}`, { requiresApproval: next });
    } catch {
      setRequiresApproval(!next);
      toast.error("ไม่สามารถบันทึกการตั้งค่าได้");
    } finally {
      setTogglingApproval(false);
    }
  }, [id, requiresApproval, togglingApproval, toast]);

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <TripStepperHeader currentStep={3} tripId={id} subtitle="ดูตัวอย่าง" />
        <div className="flex-1 p-4 lg:p-8 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-5 flex justify-center">
              <Skeleton className="w-[320px] h-[600px] rounded-[3rem]" />
            </div>
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) return <div className="p-8 text-center text-(--on-surface-variant)">ไม่พบข้อมูลทริป</div>;

  const days = [...trip.days].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, totalDays);

  const mapActivities: MapActivity[] = (days[previewDay]?.activities ?? [])
    .flatMap((a) => {
      const coords = resolveCoords(a.lat, a.lng, a.mapsLink);
      if (!coords) return [];
      return [{ name: a.name, lat: coords.lat, lng: coords.lng, time: a.time ?? undefined }];
    });

  return (
    <div className="flex flex-col min-h-screen">
      <TripStepperHeader currentStep={3} tripId={id} subtitle="ดูตัวอย่าง" />

      {/* ═══ Action Bar ═══ */}
      <FooterActionBar
        backLabel="ย้อนกลับ"
        onBack={() => router.push(ROUTES.tripEdit(id))}
        nextLabel={
          isPendingReview ? "รอตรวจสอบ..."
          : isPublished ? "ส่งตรวจสอบอีกครั้ง"
          : "ส่งตรวจสอบ"
        }
        nextVariant="success"
        nextIcon={isPendingReview ? "hourglass_empty" : "send"}
        onNext={() => !isPendingReview && setShowSubmitModal(true)}
        disabled={issues.length > 0 || isPendingReview}
      />

      {/* ═══ Content ═══ */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-(--on-surface) tracking-tight mb-8">ดูตัวอย่างก่อนเผยแพร่</h2>

          {isUnpublished && trip.staffUnpublishReason && (
            <Banner variant="warning" icon="block" title="ถูกระงับโดยทีมงาน" className="mb-6">
              <p className="text-sm text-amber-700 leading-relaxed">{trip.staffUnpublishReason}</p>
              <p className="text-xs text-amber-600 mt-2">กรุณาแก้ไขตามเหตุผลด้านบน แล้วส่งตรวจสอบใหม่อีกครั้ง</p>
            </Banner>
          )}

          {/* Validation issues — each row links to the step that owns the
              missing data so the user doesn't have to guess. */}
          {issues.length > 0 && (
            <Banner variant="warning" title="ยังไม่พร้อมเผยแพร่" className="mb-6">
              <ul className="space-y-1">
                {issues.map((issue) => {
                  const href =
                    issue.fixStep === "basics"
                      ? `/dashboard/trips/new?id=${id}`
                      : issue.fixStep === "activities"
                        ? ROUTES.tripEdit(id)
                        : null;
                  return (
                    <li key={issue.code} className="text-xs flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-amber-400" />
                      {href ? (
                        <Link href={href} className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 underline-offset-2">
                          {issue.message}
                        </Link>
                      ) : (
                        <span className="text-amber-700">{issue.message}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Banner>
          )}

          {/* Pinned announcement banner — operator sees what followers see */}
          {trip.pinnedAnnouncement && (
            <div className="mb-6 flex items-start gap-3 px-5 py-4 bg-orange-50 border border-orange-200 rounded-2xl">
              <span className="material-symbols-outlined text-orange-500 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-widest mb-1">ประกาศล่าสุด (ปักหมุด)</p>
                <p className="text-sm text-orange-900 whitespace-pre-wrap">{trip.pinnedAnnouncement.message}</p>
                <p className="text-[11px] text-orange-600 mt-1">{new Date(trip.pinnedAnnouncement.createdAt).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <Link href={`/dashboard/trips/${id}/manage?tab=announcements`} className="text-xs text-orange-700 underline hover:text-orange-900 shrink-0 mt-0.5">จัดการ</Link>
            </div>
          )}

          {/* ═══ Main Grid ═══ */}
          <div className="grid grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="col-span-12 lg:col-span-5 flex flex-col items-center gap-2 order-1 lg:sticky lg:top-6 lg:self-start">
              <MobilePreview
                title={trip.title}
                startDate={trip.startDate}
                endDate={trip.endDate}
                totalDays={totalDays}
                travelersCount={trip.travelersCount}
                coverImageUrl={trip.coverImageUrl}
                airlineName={trip.airlineInfo[0]?.airline ?? null}
                accommodationsCount={trip.accommodations.length}
                countdownDays={countdown}
                days={days}
                activeDayIndex={previewDay}
                onActiveDayChange={setPreviewDay}
              />
              <p className="text-[10px] text-(--on-surface-variant) tracking-wider uppercase font-semibold">ตัวอย่างหน้าตาบนมือถือ</p>
            </div>

            {/* Right: Controls */}
            <div className="col-span-12 lg:col-span-7 space-y-6 order-2">

              {/* Status Card — colour reflects state at a glance:
                  pending = orange, unpublished = rose (was draft-grey
                  and easy to mistake for "not started yet"), published
                  = primary, draft = neutral. */}
              <div className={`rounded-3xl p-6 md:p-8 shadow-sm border ${
                isPendingReview ? "bg-orange-50 border-orange-200"
                  : isUnpublished ? "bg-rose-50 border-rose-200"
                  : isDraft && trip.rejectionItems && trip.rejectionItems.length > 0 ? "bg-red-50 border-red-200"
                  : "bg-white border-(--outline-variant)/30"
              }`}>
                <div className="flex items-start gap-4">
                  {/* Status icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    isPublished ? "bg-(--primary-container) text-(--on-primary-container)"
                    : isPendingReview ? "bg-orange-100 text-orange-600"
                    : isUnpublished ? "bg-rose-100 text-rose-600"
                    : isDraft && trip.rejectionItems && trip.rejectionItems.length > 0 ? "bg-red-100 text-red-600"
                    : "bg-(--surface-variant) text-(--on-surface-variant)"
                  }`}>
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isPublished ? "check_circle"
                        : isPendingReview ? "hourglass_empty"
                        : isUnpublished ? "block"
                        : isDraft && trip.rejectionItems && trip.rejectionItems.length > 0 ? "cancel"
                        : "edit_note"}
                    </span>
                  </div>

                  {/* Status text + action */}
                  <div className="flex-1 min-w-0">
                    {/* Title row: heading + visibility badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold text-lg leading-tight ${
                        isPendingReview ? "text-orange-800"
                        : isUnpublished ? "text-rose-800"
                        : isDraft && trip.rejectionItems && trip.rejectionItems.length > 0 ? "text-red-800"
                        : "text-(--on-surface)"
                      }`}>
                        {isPublished ? "เผยแพร่แล้ว"
                          : isPendingReview ? "รอตรวจสอบ"
                          : isDraft && trip.rejectionItems && trip.rejectionItems.length > 0 ? "ไม่ผ่านการตรวจสอบ"
                          : isDraft ? "ฉบับร่าง"
                          : "ยกเลิกเผยแพร่แล้ว"}
                      </h3>
                      {isPublished && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-(--primary-container) text-(--on-primary-container) text-[10px] font-bold">
                          <span className="material-symbols-outlined text-xs">link</span>
                          {trip.visibility === "marketplace" ? "แสดงบน Marketplace" : "เฉพาะคนที่มีลิงก์"}
                        </span>
                      )}
                      {isPendingReview && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-100 text-orange-700 text-[10px] font-bold">
                          <span className="material-symbols-outlined text-xs">
                            {trip.visibility === "marketplace" ? "storefront" : "link"}
                          </span>
                          {trip.visibility === "marketplace" ? "ขอเข้า Marketplace" : "เฉพาะคนที่มีลิงก์"}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className={`text-sm mt-0.5 ${
                      isPendingReview ? "text-orange-700"
                      : isUnpublished ? "text-rose-700"
                      : isDraft && trip.rejectionItems && trip.rejectionItems.length > 0 ? "text-red-700"
                      : "text-(--on-surface-variant)"
                    }`}>
                      {isPublished ? "ทุกคนที่มีลิงก์สามารถเข้าดูได้"
                        : isPendingReview ? "ทีมงานกำลังตรวจสอบ จะแจ้งผลทาง email โดยเร็ว"
                        : isDraft && trip.rejectionItems && trip.rejectionItems.length > 0
                          ? "ทริปถูกส่งกลับ กรุณาแก้ไขตามรายการที่แจ้งและส่งตรวจสอบใหม่"
                        : isDraft ? "ยังไม่เผยแพร่ มีแค่คุณที่เห็น"
                        : "ลูกทริปไม่สามารถเข้าดูได้จนกว่าจะส่งตรวจสอบใหม่"}
                    </p>

                    {/* Submitted timestamp + cancel button row */}
                    {isPendingReview && (
                      <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
                        {trip.submittedAt ? (
                          <p className="flex items-center gap-1 text-xs text-orange-500">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            ส่งเมื่อ {new Date(trip.submittedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        ) : <span />}
                        <button
                          onClick={() => setShowCancelConfirm(true)}
                          disabled={cancelling}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          ยกเลิกส่งตรวจสอบ
                        </button>
                      </div>
                    )}

                    {/* Unpublish button */}
                    {isPublished && (
                      <div className="mt-2">
                        <button
                          onClick={() => setShowUnpublishConfirm(true)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-(--on-surface-variant) hover:bg-(--surface-variant) transition-colors whitespace-nowrap"
                        >
                          ยกเลิกเผยแพร่
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats row — follower / view counts only carry meaning
                    once the trip is published. Pre-publish, "0 ยอดดู"
                    looked like missing data; show them only after the
                    counters can move. */}
                <div className={`grid gap-4 mt-5 pt-5 border-t border-(--outline-variant)/20 ${isPublished ? "grid-cols-4" : "grid-cols-2"}`}>
                  {[
                    { label: "วัน", value: totalDays, alwaysShow: true },
                    { label: "กิจกรรม", value: totalActivities, alwaysShow: true },
                    { label: "ผู้ติดตาม", value: trip.followerCount, alwaysShow: false },
                    { label: "ยอดดู", value: trip.viewCount, alwaysShow: false },
                  ]
                    .filter((s) => s.alwaysShow || isPublished)
                    .map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-xl font-extrabold text-(--on-surface)">{s.value}</p>
                      <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Join approval toggle */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30">
                <h3 className="font-bold text-(--on-surface) mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-(--primary)">how_to_reg</span>
                  การเข้าร่วมทริป
                </h3>
                <button
                  type="button"
                  onClick={handleToggleApproval}
                  disabled={togglingApproval}
                  aria-pressed={requiresApproval}
                  className={`w-full flex items-center justify-between gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    requiresApproval
                      ? "border-(--primary) bg-(--primary-container)/20"
                      : "border-(--outline-variant)/40 bg-(--surface-container-low) hover:border-(--primary)/30"
                  } ${togglingApproval ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`material-symbols-outlined text-2xl ${requiresApproval ? "text-(--primary)" : "text-(--on-surface-variant)"}`}
                      style={requiresApproval ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {requiresApproval ? "lock" : "lock_open"}
                    </span>
                    <div>
                      <p className={`font-bold text-sm ${requiresApproval ? "text-(--primary)" : "text-(--on-surface)"}`}>
                        {requiresApproval ? "ต้องอนุมัติก่อนเข้าร่วม" : "เข้าร่วมได้ทันที"}
                      </p>
                      <p className="text-xs text-(--on-surface-variant) mt-0.5">
                        {requiresApproval
                          ? "ผู้ขอเข้าร่วมจะได้สถานะ 'รอการอนุมัติ' จนกว่าคุณจะอนุมัติ"
                          : "ผู้ที่มีลิงก์ทริปสามารถเข้าร่วมและเห็นข้อมูลได้ทันที"}
                      </p>
                    </div>
                  </div>
                  <div className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${requiresApproval ? "bg-(--primary)" : "bg-(--outline-variant)"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${requiresApproval ? "left-7" : "left-1"}`} />
                  </div>
                </button>
              </div>

              {/* Rejection items panel — shown when trip was rejected (Draft + rejectionItems) */}
              {isDraft && trip.rejectionItems && trip.rejectionItems.length > 0 && (
                <div className="bg-red-50 rounded-3xl border border-red-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-red-100 flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-red-800 text-sm">ทริปไม่ผ่านการตรวจสอบ</h3>
                      <p className="text-xs text-red-600 mt-0.5">กรุณาแก้ไขรายการด้านล่างแล้วส่งตรวจสอบใหม่</p>
                    </div>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full shrink-0">
                      {trip.rejectionItems.length} รายการ
                    </span>
                  </div>
                  <div className="divide-y divide-red-100">
                    {trip.rejectionItems.map((item) => {
                      const ITEM_ICONS: Record<string, string> = {
                        cover: "image", basic: "info", transport: "flight",
                        hotel: "hotel", emergency: "emergency", notes: "sticky_note_2", program: "event_note",
                      };
                      const ITEM_FIX_HREF: Record<string, string> = {
                        cover: `/dashboard/trips/new?id=${id}`,
                        basic: `/dashboard/trips/new?id=${id}`,
                      };
                      const fixHref = ITEM_FIX_HREF[item.itemId] ?? ROUTES.tripEdit(id);
                      return (
                        <div key={item.id} className="px-6 py-4 flex items-start gap-3">
                          <span className="material-symbols-outlined text-red-400 text-lg shrink-0 mt-0.5">{ITEM_ICONS[item.itemId] ?? "error"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-red-800">{item.itemLabel}</p>
                            <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{item.reason}</p>
                          </div>
                          <Link
                            href={fixHref}
                            className="shrink-0 flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            แก้ไข
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Transport segments — only when data present */}
              {trip.airlineInfo.length > 0 && trip.airlineInfo.some((a) => a.departureAirport || a.airline) && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30">
                  <h3 className="font-bold text-(--on-surface) mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-(--primary)">flight</span>
                    ข้อมูลการเดินทาง
                  </h3>
                  <div className="space-y-4">
                    {trip.airlineInfo.map((seg, i) => {
                      const depTz = seg.departureAirport ? airportTimezone(seg.departureAirport) : undefined;
                      const arrTz = seg.arrivalAirport ? airportTimezone(seg.arrivalAirport) : undefined;
                      const depOffset = depTz ? utcOffsetLabel(depTz) : null;
                      const arrOffset = arrTz ? utcOffsetLabel(arrTz) : null;
                      const TRANSPORT_ICONS: Record<string, string> = {
                        flight: "flight", van: "airport_shuttle", bus: "directions_bus",
                        train: "train", boat: "directions_boat", car: "directions_car",
                      };
                      const icon = TRANSPORT_ICONS[seg.transportType] ?? "directions_car";
                      return (
                        <div key={i} className="bg-(--surface-container-low) rounded-2xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base text-(--primary)">{icon}</span>
                            <span className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-wide">
                              {seg.type === "departure" ? "ขาไป" : "ขากลับ"}
                            </span>
                            {seg.airline && <span className="text-xs font-semibold text-(--on-surface)">{seg.airline}</span>}
                            {seg.flightNumber && (
                              <span className="ml-auto text-xs font-bold text-(--on-surface-variant) font-mono">{seg.flightNumber}</span>
                            )}
                          </div>

                          {/* Route row */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`font-extrabold text-(--on-surface) ${isIataCode(seg.departureAirport) ? "text-lg tracking-widest font-mono" : "text-base"}`}>
                                {seg.departureAirport ?? "—"}
                              </p>
                              {seg.departureTime && (
                                <p className="text-xs text-(--on-surface-variant)">
                                  {seg.departureTime}
                                  {depOffset && <span className="ml-1 text-[11px] font-bold text-(--primary)">({depOffset})</span>}
                                </p>
                              )}
                              {seg.departureDate && <p className="text-[11px] text-(--on-surface-variant)">{seg.departureDate}</p>}
                            </div>
                            <span className="material-symbols-outlined text-(--outline) shrink-0">arrow_forward</span>
                            <div className="flex-1 min-w-0 text-right">
                              <p className={`font-extrabold text-(--on-surface) ${isIataCode(seg.arrivalAirport) ? "text-lg tracking-widest font-mono" : "text-base"}`}>
                                {seg.arrivalAirport ?? "—"}
                              </p>
                              {seg.arrivalTime && (
                                <p className="text-xs text-(--on-surface-variant)">
                                  {seg.arrivalTime}
                                  {arrOffset && <span className="ml-1 text-[11px] font-bold text-(--primary)">({arrOffset})</span>}
                                </p>
                              )}
                              {seg.arrivalDate && <p className="text-[11px] text-(--on-surface-variant)">{seg.arrivalDate}</p>}
                            </div>
                          </div>

                          {seg.bookingRef && (
                            <div className="flex items-center gap-2 pt-2 border-t border-(--outline-variant)/20">
                              <span className="material-symbols-outlined text-xs text-(--on-surface-variant)">bookmark</span>
                              <span className="text-xs text-(--on-surface-variant)">รหัสจอง:</span>
                              <span className="text-xs font-bold font-mono text-(--on-surface)">{seg.bookingRef}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Trip info summary — always visible */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30">
                <h3 className="font-bold text-(--on-surface) mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-(--primary)">info</span>
                  ข้อมูลทริป
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-(--on-surface-variant) font-bold uppercase tracking-widest mb-1">จุดหมาย</p>
                    <p className="font-semibold text-(--on-surface)">{trip.destination}</p>
                  </div>
                  <div>
                    <p className="text-xs text-(--on-surface-variant) font-bold uppercase tracking-widest mb-1">วันเดินทาง</p>
                    <p className="font-semibold text-(--on-surface)">{formatDateFullTH(trip.startDate)} — {formatDateFullTH(trip.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-(--on-surface-variant) font-bold uppercase tracking-widest mb-1">ผู้เดินทาง</p>
                    <p className="font-semibold text-(--on-surface)">{trip.travelersCount} คน</p>
                  </div>
                  <div>
                    <p className="text-xs text-(--on-surface-variant) font-bold uppercase tracking-widest mb-1">ที่พัก</p>
                    <p className="font-semibold text-(--on-surface)">{trip.accommodations.length} แห่ง</p>
                  </div>
                </div>
                {trip.checklistItems && trip.checklistItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-(--outline-variant)/20">
                    <p className="text-xs text-(--on-surface-variant) font-bold uppercase tracking-widest mb-3">สิ่งที่ต้องเตรียม</p>
                    <ul className="space-y-2">
                      {trip.checklistItems.map((item) => (
                        <li key={item.id} className="flex items-center gap-2.5 text-sm">
                          <span className={`w-4 h-4 rounded border-2 shrink-0 ${item.isRequired ? "border-(--error)" : "border-(--outline-variant)"}`} />
                          <span className="text-(--on-surface) flex-1">{item.label}</span>
                          {item.isRequired && (
                            <span className="text-[10px] font-bold text-(--error) uppercase tracking-wide">จำเป็น</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {trip.importantNotes && (
                  <div className="mt-4 pt-4 border-t border-(--outline-variant)/20">
                    <p className="text-xs text-(--on-surface-variant) font-bold uppercase tracking-widest mb-2">หมายเหตุ</p>
                    <p className="text-sm text-(--on-surface) whitespace-pre-line">{trip.importantNotes}</p>
                  </div>
                )}
              </div>

              {/* Currency Widget — international trips only */}
              {trip.scope === "international" && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30">
                  <h3 className="font-bold text-(--on-surface) mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-(--primary)">currency_exchange</span>
                    แปลงสกุลเงิน
                  </h3>
                  <CurrencyWidget />
                </div>
              )}

              {/* ─── Translation Languages Card (read-only) ─── */}
              {availableLanguages.length > 1 && trip && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="font-bold text-(--on-surface) flex items-center gap-2">
                      <span className="material-symbols-outlined text-(--primary)">translate</span>
                      ภาษาที่รองรับ
                    </h3>
                    <Link
                      href={`/dashboard/trips/${id}/translations`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-(--outline-variant)/40 text-(--on-surface-variant) text-xs font-bold hover:bg-(--surface-container-low) transition-colors whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-sm">edit_note</span>
                      จัดการคำแปล
                    </Link>
                  </div>
                  {supportedLangs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {supportedLangs.map((code) => {
                        const lang = availableLanguages.find((l) => l.code === code);
                        const isRemoving = removingLang === code;
                        return (
                          <span key={code} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-semibold transition-opacity ${isRemoving ? "opacity-50 bg-(--surface-variant) text-(--on-surface-variant)" : "bg-(--primary-container) text-(--on-primary-container)"}`}>
                            {lang?.flag && <span>{lang.flag}</span>}
                            {lang?.nameNative ?? code.toUpperCase()}
                            <button
                              type="button"
                              onClick={() => handleRemoveLang(code)}
                              disabled={removingLang !== null}
                              className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors disabled:cursor-not-allowed"
                              title={`ลบภาษา ${lang?.nameNative ?? code}`}
                            >
                              {isRemoving
                                ? <span className="material-symbols-outlined text-[12px]">progress_activity</span>
                                : <span className="material-symbols-outlined text-[12px]">close</span>
                              }
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-(--on-surface-variant) italic">
                      ยังไม่ได้เลือกภาษาเพิ่มเติม —{" "}
                      <Link href={`/dashboard/trips/new?id=${id}`} className="text-(--primary) underline">
                        เพิ่มภาษาที่หน้าแก้ไขทริป
                      </Link>
                    </p>
                  )}
                </div>
              )}

              {/* Group chat buttons */}
              {(trip.lineGroupUrl || trip.whatsappGroupUrl || trip.telegramGroupUrl) && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30">
                  <h3 className="font-bold text-(--on-surface) mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-(--primary)">chat</span>
                    กลุ่มสนทนา
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {trip.lineGroupUrl && (
                      <a
                        href={trip.lineGroupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-green-500 text-white text-sm font-semibold shadow-sm hover:bg-green-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">chat</span>
                        เข้ากลุ่ม LINE
                      </a>
                    )}
                    {trip.whatsappGroupUrl && (
                      <a
                        href={trip.whatsappGroupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-green-600 text-white text-sm font-semibold shadow-sm hover:bg-green-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">phone_in_talk</span>
                        เข้ากลุ่ม WhatsApp
                      </a>
                    )}
                    {trip.telegramGroupUrl && (
                      <a
                        href={trip.telegramGroupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-500 text-white text-sm font-semibold shadow-sm hover:bg-blue-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">send</span>
                        เข้ากลุ่ม Telegram
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Trip Link — only if published */}
              {isPublished && tripUrl && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30">
                  <h3 className="font-bold text-(--on-surface) mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-(--primary)">link</span>
                    ลิงก์ทริป
                  </h3>
                  <div className="flex items-center gap-2 bg-(--surface-container-low) p-1.5 pl-4 rounded-xl border border-(--outline-variant)/30">
                    <span className="text-sm text-(--on-surface) font-medium truncate flex-1">{tripUrl}</span>
                    <button
                      onClick={copyLink}
                      className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${copied ? "bg-(--primary-container) text-(--on-primary-container)" : "bg-(--primary) text-(--on-primary) hover:opacity-90"}`}
                    >
                      {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                    </button>
                  </div>
                </div>
              )}

              {/* QR Code — only if published */}
              {isPublished && tripUrl && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30">
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <div className="bg-white border-4 border-(--surface-variant)/50 p-2 rounded-2xl shadow-inner shrink-0">
                      <QRCodeDisplay url={tripUrl} size={160} />
                    </div>
                    <div className="flex-1 space-y-4 text-center sm:text-left">
                      <h3 className="font-bold text-(--on-surface)">QR Code</h3>
                      <p className="text-sm text-(--on-surface-variant)">สร้าง QR Code สำหรับพิมพ์หรือแปะบนเอกสาร</p>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <button
                          onClick={downloadQR}
                          className="px-5 py-2.5 bg-(--on-surface) text-(--surface) rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">download</span>
                          ดาวน์โหลด PNG
                        </button>
                        <button
                          onClick={downloadIcs}
                          className="px-5 py-2.5 bg-(--secondary-container) text-(--on-secondary-container) rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">calendar_add_on</span>
                          เพิ่มในปฏิทิน (.ics)
                        </button>
                        <button
                          onClick={downloadPdf}
                          className="px-5 py-2.5 bg-(--tertiary-container) text-(--on-tertiary-container) rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                          ดาวน์โหลด PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Share — only if published */}
              {isPublished && tripUrl && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30">
                  <h3 className="font-bold text-(--on-surface) mb-4">แชร์ให้ลูกทริป</h3>
                  <div className="space-y-4">
                    {/* LINE */}
                    <div className="p-4 bg-(--primary-container)/20 rounded-2xl border border-(--primary)/10">
                      <div className="flex items-start gap-4">
                        <IconWrapper icon="chat" size="md" className="bg-[#06C755] text-white" />
                        <div className="flex-1">
                          <h4 className="font-bold text-(--on-surface) text-sm">ข้อความ LINE สำเร็จรูป</h4>
                          <p className="text-xs text-(--on-surface-variant) mt-1 mb-4 italic line-clamp-2">
                            &ldquo;สวัสดีค่ะ 🙏 ทริป &quot;{trip.title}&quot; พร้อมแล้วค่ะ...&rdquo;
                          </p>
                          <button
                            onClick={copyLineMessage}
                            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${copiedLine ? "bg-green-200 text-green-800" : "bg-[#06C755] text-white hover:opacity-90"}`}
                          >
                            <span className="material-symbols-outlined text-lg">{copiedLine ? "check" : "content_copy"}</span>
                            {copiedLine ? "คัดลอกแล้ว" : "คัดลอกข้อความ LINE"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Manage link — only if published */}
              {isPublished && (
                <Link
                  href={ROUTES.tripManage(id)}
                  className="block bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30 hover:border-(--primary)/30 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <IconWrapper icon="analytics" size="md" />
                      <div>
                        <h3 className="font-bold text-(--on-surface) text-sm">สถานะการรับทราบ</h3>
                        <p className="text-xs text-(--on-surface-variant)">ดูว่าใครรับทราบการเปลี่ยนแปลงแล้ว</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-(--on-surface-variant) group-hover:text-(--primary) group-hover:translate-x-1 transition-all">arrow_forward</span>
                  </div>
                </Link>
              )}

              {/* Group members — only when any member has a role */}
              {trip.groupMembers && trip.groupMembers.length > 0 && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30">
                  <h3 className="font-bold text-(--on-surface) mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-(--primary)">groups</span>
                    สมาชิกในกลุ่ม
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trip.groupMembers.map((m, i) => {
                      const roleLabel: Record<string, string> = {
                        head_of_group: "หัวหน้ากลุ่ม",
                        expense_keeper: "ผู้ดูแลค่าใช้จ่าย",
                        driver: "คนขับ",
                        member: "สมาชิก",
                      };
                      const label = roleLabel[m.groupRole] ?? m.groupRole;
                      const isHead = m.groupRole === "head_of_group";
                      return (
                        <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${isHead ? "border-amber-300 bg-amber-50" : "border-(--outline-variant)/30 bg-(--surface-container-low)"}`}>
                          <span className={`font-semibold ${isHead ? "text-amber-800" : "text-(--on-surface)"}`}>{m.displayName}</span>
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isHead ? "bg-amber-200 text-amber-700" : "bg-(--surface-variant) text-(--on-surface-variant)"}`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Map card — only when the active day has locatable activities */}
              {mapActivities.length > 0 && googleMapsApiKey && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30">
                  <h3 className="font-bold text-(--on-surface) mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-(--primary)">map</span>
                    แผนที่วันที่ {(days[previewDay]?.dayNumber ?? previewDay + 1)}
                    <span className="ml-auto text-xs font-normal text-(--on-surface-variant)">{mapActivities.length} จุด</span>
                  </h3>
                  <TripDayMapLazy activities={mapActivities} apiKey={googleMapsApiKey} />
                </div>
              )}

              {/* Photo gallery — only when the active day has activities with images */}
              {(() => {
                const activitiesWithImages = (days[previewDay]?.activities ?? [])
                  .map((a) => ({ name: a.name, emoji: a.emoji, urls: a.imageUrls ?? [] }))
                  .filter((a) => a.urls.length > 0);
                if (activitiesWithImages.length === 0) return null;
                const allUrls = activitiesWithImages.flatMap((a) => a.urls);
                return (
                  <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-(--outline-variant)/30">
                    <h3 className="font-bold text-(--on-surface) mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-(--primary)">photo_library</span>
                      รูปภาพวันที่ {days[previewDay]?.dayNumber ?? previewDay + 1}
                      <span className="ml-auto text-xs font-normal text-(--on-surface-variant)">{allUrls.length} รูป</span>
                    </h3>
                    <div className="space-y-4">
                      {activitiesWithImages.map((act, ai) => (
                        <div key={ai}>
                          <p className="text-xs font-semibold text-(--on-surface-variant) mb-2 flex items-center gap-1.5">
                            <span>{act.emoji ?? "📍"}</span>
                            {act.name}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {act.urls.map((url, ui) => {
                              const globalIdx = allUrls.indexOf(url, activitiesWithImages.slice(0, ai).reduce((s, a) => s + a.urls.length, 0));
                              return (
                                <button
                                  key={ui}
                                  type="button"
                                  onClick={() => { setLightboxImages(allUrls); setLightboxIdx(globalIdx >= 0 ? globalIdx : 0); }}
                                  className="w-20 h-20 rounded-xl overflow-hidden border border-(--outline-variant)/30 hover:ring-2 hover:ring-(--primary) transition-all shrink-0"
                                  title="คลิกเพื่อดูขยาย"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt={`${act.name} รูปที่ ${ui + 1}`} className="w-full h-full object-cover" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Lightbox ═══ */}
      {lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxImages([])}
        >
          {/* Stop propagation so clicking the image doesn't close */}
          <div className="relative max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImages[lightboxIdx]}
              alt={`รูปที่ ${lightboxIdx + 1}`}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
            {/* Nav: prev */}
            {lightboxIdx > 0 && (
              <button
                onClick={() => setLightboxIdx((i) => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
            )}
            {/* Nav: next */}
            {lightboxIdx < lightboxImages.length - 1 && (
              <button
                onClick={() => setLightboxIdx((i) => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            )}
            {/* Counter + close */}
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-bold">
                {lightboxIdx + 1} / {lightboxImages.length}
              </span>
              <button
                onClick={() => setLightboxImages([])}
                className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Emergency FAB (mobile only) ═══ */}
      {trip && <EmergencyFab contacts={trip.emergencyContacts} />}

      <SubmitReviewModal
        open={showSubmitModal}
        isPublished={isPublished}
        isPendingReview={isPendingReview}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        linkPreview={`${CLIENT_BASE}/t/${trip?.slug || `${username || "user"}/${id.slice(0, 8)}`}`}
        publishedQuotaSource={trip?.publishedQuotaSource ?? null}
        submitting={submitting}
        onSubmit={handleSubmitReview}
        onClose={() => setShowSubmitModal(false)}
      />

      {/* ═══ Cancel Review Confirm ═══ */}
      <ConfirmDialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelReview}
        title="ยกเลิกการส่งตรวจสอบ"
        description="ทริปจะกลับสู่สถานะ ฉบับร่าง คุณสามารถแก้ไขและส่งใหม่ได้ภายหลัง"
        confirmLabel="ยกเลิกส่งตรวจสอบ"
        variant="danger"
      />

      {/* ═══ Unpublish Confirm ═══ */}
      <ConfirmDialog
        open={showUnpublishConfirm}
        onClose={() => setShowUnpublishConfirm(false)}
        onConfirm={handleUnpublish}
        title="ยกเลิกเผยแพร่"
        description="ลูกทริปจะไม่สามารถเข้าดูทริปนี้ผ่านลิงก์ได้อีก คุณยืนยันหรือไม่?"
        confirmLabel="ยกเลิกเผยแพร่"
        variant="danger"
      />
    </div>
  );
}
