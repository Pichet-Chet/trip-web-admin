import { z } from "zod";

/**
 * Validation schemas for the trip wizard.
 *
 * Two distinct gates:
 *  - `tripBasicsSchema` runs at "Save & continue" from /trips/new. Cheap,
 *    field-level: catches missing required fields, swapped dates, sane
 *    traveler counts. Doesn't enforce content completeness — drafts are
 *    allowed to be partial as long as the basics resolve.
 *  - `tripPublishSchema` runs at "Submit for review" from /preview. Hard
 *    gate that requires every public-facing piece (cover image, full
 *    itinerary, transport for international trips, etc.) to be filled.
 *
 * Limits use power-of-2 lengths per project convention.
 */

const TRIM = (s: string) => s.trim();

/* ─── Field primitives ─── */

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง");

const optionalDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง")
  .or(z.literal(""));

const phone = z
  .string()
  .max(64, "เบอร์โทรยาวเกินไป")
  // Lenient: allow digits, +, -, space, parentheses. We don't validate
  // country-specific formats — the wizard targets a global audience.
  .regex(/^[\d+\-\s()]*$/, "เบอร์โทรมีอักขระไม่ถูกต้อง")
  .or(z.literal(""));

/* ─── Save & continue (trips/new → trips/[id]/edit) ─── */

export const tripBasicsSchema = z
  .object({
    title: z
      .string()
      .transform(TRIM)
      .pipe(z.string().min(1, "กรุณากรอกชื่อทริป").max(256, "ชื่อทริปยาวเกินไป")),
    destination: z
      .string()
      .transform(TRIM)
      .pipe(z.string().min(1, "กรุณากรอกจุดหมายปลายทาง").max(256, "จุดหมายปลายทางยาวเกินไป")),
    startDate: dateString.refine((s) => s.length > 0, "กรุณาเลือกวันเดินทาง"),
    endDate: dateString.refine((s) => s.length > 0, "กรุณาเลือกวันกลับ"),
    travelersCount: z.coerce
      .number({ message: "กรุณากรอกจำนวนผู้เดินทาง" })
      .int("จำนวนผู้เดินทางต้องเป็นจำนวนเต็ม")
      .min(1, "ต้องมีผู้เดินทางอย่างน้อย 1 คน")
      .max(999, "จำนวนผู้เดินทางมากเกินไป"),
    notes: z.string().max(4096, "หมายเหตุยาวเกินไป").optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "วันกลับต้องไม่ก่อนวันเดินทาง",
    path: ["endDate"],
  });

export type TripBasicsInput = z.input<typeof tripBasicsSchema>;
export type TripBasics = z.output<typeof tripBasicsSchema>;

/* ─── Hotel + emergency contact (used by both gates) ─── */

export const hotelSchema = z
  .object({
    name: z.string().transform(TRIM).pipe(z.string().max(256, "ชื่อที่พักยาวเกินไป")),
    address: z.string().max(512, "ที่อยู่ยาวเกินไป").optional(),
    phone,
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    nights: z.number().int().min(0).max(365),
  })
  .refine(
    (h) => {
      if (!h.checkIn || !h.checkOut) return true;
      const ci = h.checkIn.split("T")[0];
      const co = h.checkOut.split("T")[0];
      return co >= ci;
    },
    { message: "วันเช็คเอาท์ต้องไม่ก่อนวันเช็คอิน", path: ["checkOut"] },
  );

export const emergencyContactSchema = z.object({
  name: z.string().transform(TRIM).pipe(z.string().max(128, "ชื่อยาวเกินไป")),
  phone,
});

/* ─── Publish gate (trips/[id]/preview → submit for review) ─── */
//
// Surface "what is missing?" rather than first-error-blocks-all. Returns
// an array of issues so the UI can render them as a checklist.

export interface PublishContext {
  title: string;
  destination: string;
  coverImageUrl: string | null;
  scope: "domestic" | "international" | string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalActivities: number;
  daysWithoutActivity: number;
  daysCount: number;
  hasOutboundTransport: boolean;
  hasReturnTransport: boolean;
}

export interface PublishIssue {
  /** Stable code so the UI can map to a deep-link target. */
  code:
    | "title"
    | "destination"
    | "cover"
    | "days"
    | "activities"
    | "empty-day"
    | "outbound"
    | "return"
    | "dates";
  message: string;
  /** Where to send the user to fix it. Relative to the trip. */
  fixStep: "basics" | "activities" | "preview";
}

export function checkPublishReadiness(ctx: PublishContext): PublishIssue[] {
  const issues: PublishIssue[] = [];

  if (!ctx.title.trim()) {
    issues.push({ code: "title", message: "ยังไม่มีชื่อทริป", fixStep: "basics" });
  }
  if (!ctx.destination.trim()) {
    issues.push({ code: "destination", message: "ยังไม่มีจุดหมายปลายทาง", fixStep: "basics" });
  }
  if (!ctx.coverImageUrl) {
    issues.push({ code: "cover", message: "ยังไม่ได้เลือกภาพปก", fixStep: "basics" });
  }
  if (!ctx.startDate || !ctx.endDate) {
    issues.push({ code: "dates", message: "ยังไม่ได้กำหนดวันเดินทาง", fixStep: "basics" });
  }
  if (ctx.daysCount === 0) {
    issues.push({ code: "days", message: "ยังไม่มีรายการวัน", fixStep: "activities" });
  }
  if (ctx.totalActivities === 0) {
    issues.push({ code: "activities", message: "ยังไม่มีกิจกรรมเลย", fixStep: "activities" });
  }
  if (ctx.daysWithoutActivity > 0 && ctx.daysCount > 0 && ctx.totalActivities > 0) {
    issues.push({
      code: "empty-day",
      message: `มี ${ctx.daysWithoutActivity} วันที่ยังไม่มีกิจกรรม`,
      fixStep: "activities",
    });
  }
  if (ctx.scope === "international" && !ctx.hasOutboundTransport) {
    issues.push({ code: "outbound", message: "ยังไม่ได้กรอกข้อมูลขาไป", fixStep: "basics" });
  }
  if (ctx.scope === "international" && !ctx.hasReturnTransport) {
    issues.push({ code: "return", message: "ยังไม่ได้กรอกข้อมูลขากลับ", fixStep: "basics" });
  }

  return issues;
}
