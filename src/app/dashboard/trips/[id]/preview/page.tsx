"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { api, ApiError } from "@/lib/api";
import { TripStepperHeader } from "@/components/layout/trip-stepper";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { IconWrapper, FooterActionBar, QRCodeDisplay, Skeleton, ConfirmDialog, Banner } from "@/components/shared";
import { useToast } from "@/components/shared/toast";
import { checkPublishReadiness, type PublishIssue } from "@/lib/validation/trip";
import { MobilePreview } from "./_components/mobile-preview";
import { SubmitReviewModal } from "./_components/submit-review-modal";

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
  publishedQuotaSource: string | null;
}

interface DayDetail {
  id: string;
  dayNumber: number;
  title: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  date: string | null;
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

  /* ─── Load trip ─── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<TripDetail>(`/admin/trips/${id}`);
        if (!cancelled) setTrip(data);
      } catch (err) {
        if (!cancelled) toast(err instanceof ApiError ? err.message : "ไม่สามารถโหลดข้อมูลทริปได้", "error");
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
      toast(res.message || "ส่งตรวจสอบเรียบร้อย ทีมงานจะตรวจสอบและแจ้งผลโดยเร็ว");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ไม่สามารถส่งตรวจสอบได้", "error");
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
      toast("ยกเลิกการส่งตรวจสอบแล้ว");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ไม่สามารถยกเลิกได้", "error");
    } finally {
      setCancelling(false);
    }
  }, [id, toast]);

  /* ─── Unpublish ─── */
  const handleUnpublish = useCallback(async () => {
    setUnpublishing(true);
    try {
      await api.post(`/admin/trips/${id}/unpublish`, {});
      setTrip((prev) => prev ? { ...prev, status: "Unpublished" } : prev);
      setShowUnpublishConfirm(false);
      toast("ยกเลิกเผยแพร่แล้ว ลูกทริปจะไม่สามารถเข้าดูได้");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ไม่สามารถยกเลิกเผยแพร่ได้", "error");
    } finally {
      setUnpublishing(false);
    }
  }, [id, toast]);

  /* ─── Copy link ─── */
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(tripUrl);
    setCopied(true);
    toast("คัดลอกลิงก์แล้ว");
    setTimeout(() => setCopied(false), 2000);
  }, [tripUrl, toast]);

  /* ─── Copy LINE message ─── */
  const copyLineMessage = useCallback(() => {
    const msg = `สวัสดีค่ะ 🙏\nทริป "${trip?.title}" พร้อมแล้วค่ะ\n\nเปิดดู itinerary ได้ที่:\n👉 ${tripUrl}\n\nกด "ติดตาม" เพื่อรับแจ้งเตือนเมื่อมีการเปลี่ยนแปลงค่ะ 🔔`;
    navigator.clipboard.writeText(msg);
    setCopiedLine(true);
    toast("คัดลอกข้อความ LINE แล้ว");
    setTimeout(() => setCopiedLine(false), 2000);
  }, [trip?.title, tripUrl, toast]);

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
      toast("ดาวน์โหลด QR Code แล้ว");
    } catch {
      toast("ไม่สามารถสร้าง QR Code ได้", "error");
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
        daysWithoutActivity: trip.days.filter((d) => d.activities.length === 0).length,
        hasOutboundTransport: trip.airlineInfo.some(
          (a) => a.type === "departure" && (a.airline || a.departureAirport),
        ),
        hasReturnTransport: trip.airlineInfo.some(
          (a) => a.type === "return" && (a.airline || a.departureAirport),
        ),
      })
    : [];

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <TripStepperHeader currentStep={4} tripId={id} subtitle="ดูตัวอย่าง" />
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

  return (
    <div className="flex flex-col min-h-screen">
      <TripStepperHeader currentStep={4} tripId={id} subtitle="ดูตัวอย่าง" />

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

          {/* ═══ Main Grid ═══ */}
          <div className="grid grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="col-span-12 lg:col-span-5 flex flex-col items-center gap-2 order-1">
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

              {/* Status Card */}
              <div className={`rounded-3xl p-6 md:p-8 shadow-sm border ${isPendingReview ? "bg-orange-50 border-orange-200" : "bg-white border-(--outline-variant)/30"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      isPublished ? "bg-(--primary-container) text-(--on-primary-container)"
                      : isPendingReview ? "bg-orange-100 text-orange-600"
                      : "bg-(--surface-variant) text-(--on-surface-variant)"
                    }`}>
                      <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isPublished ? "check_circle" : isPendingReview ? "hourglass_empty" : "edit_note"}
                      </span>
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${isPendingReview ? "text-orange-800" : "text-(--on-surface)"}`}>
                        {isPublished ? "เผยแพร่แล้ว"
                          : isPendingReview ? "รอตรวจสอบ"
                          : isDraft ? "ฉบับร่าง"
                          : "ยกเลิกเผยแพร่แล้ว"}
                      </h3>
                      <p className={`text-sm ${isPendingReview ? "text-orange-700" : "text-(--on-surface-variant)"}`}>
                        {isPublished ? "ทุกคนที่มีลิงก์สามารถเข้าดูได้"
                          : isPendingReview ? "ทีมงานกำลังตรวจสอบ จะแจ้งผลทาง email โดยเร็ว"
                          : isDraft ? "ยังไม่เผยแพร่ มีแค่คุณที่เห็น"
                          : "ลูกทริปไม่สามารถเข้าดูได้จนกว่าจะส่งตรวจสอบใหม่"}
                      </p>
                      {isPublished && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg bg-(--primary-container) text-(--on-primary-container) text-[10px] font-bold">
                          <span className="material-symbols-outlined text-xs">link</span>
                          {trip.visibility === "marketplace" ? "แสดงบน Marketplace" : "เฉพาะคนที่มีลิงก์"}
                        </span>
                      )}
                      {isPendingReview && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg bg-orange-100 text-orange-700 text-[10px] font-bold">
                          <span className="material-symbols-outlined text-xs">
                            {trip.visibility === "marketplace" ? "storefront" : "link"}
                          </span>
                          {trip.visibility === "marketplace" ? "ขอเข้า Marketplace" : "เฉพาะคนที่มีลิงก์"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {isPublished && (
                      <button
                        onClick={() => setShowUnpublishConfirm(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-(--on-surface-variant) hover:bg-(--surface-variant) transition-colors whitespace-nowrap"
                      >
                        ยกเลิกเผยแพร่
                      </button>
                    )}
                    {isPendingReview && (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={cancelling}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        ยกเลิกส่งตรวจสอบ
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-(--outline-variant)/20">
                  {[
                    { label: "วัน", value: totalDays },
                    { label: "กิจกรรม", value: totalActivities },
                    { label: "ผู้ติดตาม", value: trip.followerCount },
                    { label: "ยอดดู", value: trip.viewCount },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-xl font-extrabold text-(--on-surface)">{s.value}</p>
                      <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

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
                      <button
                        onClick={downloadQR}
                        className="px-5 py-2.5 bg-(--on-surface) text-(--surface) rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto sm:mx-0"
                      >
                        <span className="material-symbols-outlined text-lg">download</span>
                        ดาวน์โหลด PNG
                      </button>
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
                        <IconWrapper icon="chat" size="md" color="bg-[#06C755] text-white" />
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
                {trip.importantNotes && (
                  <div className="mt-4 pt-4 border-t border-(--outline-variant)/20">
                    <p className="text-xs text-(--on-surface-variant) font-bold uppercase tracking-widest mb-2">หมายเหตุ</p>
                    <p className="text-sm text-(--on-surface) whitespace-pre-line">{trip.importantNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
