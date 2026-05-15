"use client";

import { useState } from "react";

interface FollowModalProps {
  tripId: string;
  slug: string;
  onClose: () => void;
  defaultName?: string;
}

export function FollowModal({ tripId, slug, onClose, defaultName = "" }: FollowModalProps): React.JSX.Element {
  const [name, setName] = useState(defaultName);
  const [channel, setChannel] = useState<"line" | "web_push" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribeWebPush(): Promise<{ endpoint: string; p256dh: string; auth: string } | null> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("เบราว์เซอร์ของคุณไม่รองรับ Web Push — ลองใช้ Chrome หรือ Edge");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setError("ต้องอนุญาตการแจ้งเตือนของเบราว์เซอร์ก่อน");
      return null;
    }

    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (!reg) {
      setError("ไม่พบ service worker — กรุณาลองใหม่อีกครั้ง");
      return null;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setError("ระบบยังไม่ได้ตั้งค่า Web Push (VAPID key)");
      return null;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    });

    const json = sub.toJSON();
    return {
      endpoint: json.endpoint ?? "",
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    };
  }

  async function handleConfirm(): Promise<void> {
    if (!channel || !name.trim() || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      if (channel === "line") {
        setError("LINE OA channel ยังไม่เปิดให้ใช้ — กรุณาเลือก Web Push");
        return;
      }

      const subscription = await subscribeWebPush();
      if (!subscription) return;

      const { followWebPush } = await import("@/lib/trip-api");
      const { ApiError } = await import("@/lib/api");

      try {
        await followWebPush({ tripId, displayName: name.trim(), subscription });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่");
        return;
      }

      localStorage.setItem(`followed_${slug}`, "1");
      window.dispatchEvent(new CustomEvent("trip-followed", { detail: { slug } }));
      setIsSuccess(true);
      setTimeout(() => onClose(), 2000);
    } finally {
      setIsSubmitting(false);
    }
  }

  function urlBase64ToUint8Array(b64: string): Uint8Array {
    const padding = "=".repeat((4 - (b64.length % 4)) % 4);
    const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  if (isSuccess) {
    return (
      <>
        <div className="fixed inset-0 bg-slate-900/60 glass-blur z-[60]" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[70] w-full max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-line-green/10 text-line-green mb-5">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="font-headline font-extrabold text-2xl text-slate-900 mb-2">เข้าร่วมสำเร็จ!</h2>
          <p className="text-on-surface-variant text-sm">คุณจะได้รับแจ้งเตือนเมื่อ plan มีการเปลี่ยนแปลง</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 glass-blur z-[60]" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[70] w-full max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hidden md:flex items-center justify-center hover:bg-slate-200">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="px-6 md:px-10 pt-10 pb-6 text-center border-b border-outline-variant/30">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-blue/10 text-brand-blue mb-5">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
          </div>
          <h2 className="font-headline font-extrabold text-2xl text-slate-900 mb-2">ติดตามทริป</h2>
          <p className="text-on-surface-variant text-sm max-w-xs mx-auto">รับข้อมูลอัปเดตสำคัญจากไกด์แบบเรียลไทม์</p>
        </div>

        <div className="px-6 md:px-10 py-8 space-y-8">
          <div className="space-y-4">
            <label className="font-headline font-bold text-[11px] uppercase tracking-[0.15em] text-on-surface-variant">เลือกช่องทางรับข่าวสาร</label>
            <div className="grid gap-3">
              {/* LINE */}
              <button onClick={() => setChannel("line")} className={`group relative w-full text-left p-4 rounded-xl border-2 transition-all ${channel === "line" ? "border-line-green bg-line-green/5" : "border-outline-variant/50 hover:border-line-green/50"}`}>
                <div className="absolute -top-2.5 right-4 bg-line-green text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10">แนะนำ</div>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-white border border-outline-variant rounded-lg flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-line-green text-2xl">chat_bubble</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">LINE OA Notifications</p>
                    <p className="text-[12px] text-on-surface-variant">อัปเดตผ่านบัญชีทางการ LINE</p>
                  </div>
                  <span className={`material-symbols-outlined text-line-green transition-opacity ${channel === "line" ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`} style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              </button>

              {/* Web Push */}
              <button onClick={() => setChannel("web_push")} className={`group w-full text-left p-4 rounded-xl border-2 transition-all ${channel === "web_push" ? "border-brand-blue bg-brand-blue/5" : "border-outline-variant/50 hover:border-brand-blue/50"}`}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-white border border-outline-variant rounded-lg flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-brand-blue text-2xl">notifications</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">Web Browser Push</p>
                    <p className="text-[12px] text-on-surface-variant">แจ้งเตือนผ่านบราวเซอร์</p>
                  </div>
                  <span className={`material-symbols-outlined text-brand-blue transition-opacity ${channel === "web_push" ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`} style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-headline font-bold text-[11px] uppercase tracking-[0.15em] text-on-surface-variant">ระบุชื่อของคุณ</label>
            <div className="relative">
              <input
                className="w-full h-12 bg-slate-50 border border-outline-variant rounded-lg px-4 pr-10 font-medium text-slate-900 focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue focus:bg-white transition-all placeholder:text-slate-400 text-sm"
                placeholder="ชื่อ-นามสกุล หรือชื่อเล่น..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl text-slate-300">person</span>
            </div>
            <div className="flex items-center gap-2 px-1">
              <span className="material-symbols-outlined text-brand-blue/60 text-lg">info</span>
              <p className="text-[11px] text-on-surface-variant italic">ไกด์จะใช้ชื่อนี้เพื่อระบุตัวตนในรายการผู้ติดตาม</p>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="material-symbols-outlined text-red-500 text-base mt-0.5 shrink-0">error</span>
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
              </div>
            )}
            <button
              onClick={handleConfirm}
              disabled={!channel || !name.trim() || isSubmitting}
              className="w-full h-14 bg-brand-blue text-white font-headline font-bold rounded-lg shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><span className="material-symbols-outlined animate-spin">progress_activity</span>กำลังดำเนินการ...</>
              ) : (
                <>Confirm & Follow<span className="material-symbols-outlined text-xl">arrow_forward</span></>
              )}
            </button>
            <button onClick={onClose} className="w-full py-3 text-on-surface-variant hover:text-slate-900 font-semibold text-xs uppercase tracking-widest text-center">
              Not now, maybe later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
