import { describe, it, expect } from "vitest";
import {
  tripBasicsSchema,
  hotelSchema,
  emergencyContactSchema,
  checkPublishReadiness,
} from "./trip";

/* ─── tripBasicsSchema ─── */

describe("tripBasicsSchema", () => {
  const valid = {
    title: "ทริปเชียงใหม่",
    destination: "เชียงใหม่",
    startDate: "2026-06-01",
    endDate: "2026-06-04",
    travelersCount: 12,
    notes: "ข้อมูลเพิ่มเติม",
  };

  it("accepts a fully-filled draft", () => {
    expect(tripBasicsSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty title (required)", () => {
    const r = tripBasicsSchema.safeParse({ ...valid, title: "  " });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === "title")?.message).toMatch(/ชื่อทริป/);
    }
  });

  it("rejects empty destination", () => {
    const r = tripBasicsSchema.safeParse({ ...valid, destination: "" });
    expect(r.success).toBe(false);
  });

  it("rejects endDate before startDate", () => {
    const r = tripBasicsSchema.safeParse({ ...valid, startDate: "2026-06-10", endDate: "2026-06-01" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "endDate" && /ก่อนวันเดินทาง/.test(i.message))).toBe(true);
    }
  });

  it("accepts same-day trip (endDate === startDate)", () => {
    const r = tripBasicsSchema.safeParse({ ...valid, startDate: "2026-06-01", endDate: "2026-06-01" });
    expect(r.success).toBe(true);
  });

  it("rejects travelersCount below 1", () => {
    const r = tripBasicsSchema.safeParse({ ...valid, travelersCount: 0 });
    expect(r.success).toBe(false);
  });

  it("rejects travelersCount above 999", () => {
    const r = tripBasicsSchema.safeParse({ ...valid, travelersCount: 1000 });
    expect(r.success).toBe(false);
  });

  it("coerces string travelersCount to number", () => {
    // The form binds <input type=number> as a string; the schema must
    // accept it so we don't have to remember to parseInt at every call.
    const r = tripBasicsSchema.safeParse({ ...valid, travelersCount: "15" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.travelersCount).toBe(15);
  });

  it("rejects malformed startDate", () => {
    const r = tripBasicsSchema.safeParse({ ...valid, startDate: "06/01/2026" });
    expect(r.success).toBe(false);
  });

  it("rejects notes longer than 4096 chars", () => {
    const r = tripBasicsSchema.safeParse({ ...valid, notes: "x".repeat(4097) });
    expect(r.success).toBe(false);
  });
});

/* ─── hotelSchema ─── */

describe("hotelSchema", () => {
  const valid = {
    name: "Hotel A",
    address: "1-2-3",
    phone: "+81-3-1234-5678",
    checkIn: "2026-06-01T15:00",
    checkOut: "2026-06-04T12:00",
    nights: 3,
  };

  it("accepts valid hotel", () => {
    expect(hotelSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts hotel without check-in/out (operator may fill later)", () => {
    expect(hotelSchema.safeParse({ ...valid, checkIn: "", checkOut: "" }).success).toBe(true);
  });

  it("rejects checkOut before checkIn", () => {
    const r = hotelSchema.safeParse({
      ...valid,
      checkIn: "2026-06-04T15:00",
      checkOut: "2026-06-01T12:00",
    });
    expect(r.success).toBe(false);
  });

  it("rejects phone with letters", () => {
    const r = hotelSchema.safeParse({ ...valid, phone: "call-me-maybe" });
    expect(r.success).toBe(false);
  });

  it("accepts empty phone", () => {
    expect(hotelSchema.safeParse({ ...valid, phone: "" }).success).toBe(true);
  });
});

/* ─── emergencyContactSchema ─── */

describe("emergencyContactSchema", () => {
  it("accepts a minimal contact", () => {
    expect(emergencyContactSchema.safeParse({ name: "ตำรวจ", phone: "1155" }).success).toBe(true);
  });

  it("rejects name longer than 128 chars", () => {
    const r = emergencyContactSchema.safeParse({ name: "x".repeat(129), phone: "1155" });
    expect(r.success).toBe(false);
  });
});

/* ─── checkPublishReadiness ─── */

describe("checkPublishReadiness", () => {
  const baseCtx = {
    title: "ทริปเชียงใหม่",
    destination: "เชียงใหม่",
    coverImageUrl: "https://example.com/cover.jpg",
    scope: "domestic",
    startDate: "2026-06-01",
    endDate: "2026-06-04",
    totalDays: 4,
    totalActivities: 8,
    daysCount: 4,
    daysWithoutActivity: 0,
    hasOutboundTransport: true,
    hasReturnTransport: true,
  };

  it("returns no issues for a complete trip", () => {
    expect(checkPublishReadiness(baseCtx)).toEqual([]);
  });

  it("flags missing cover image", () => {
    const issues = checkPublishReadiness({ ...baseCtx, coverImageUrl: null });
    expect(issues.some((i) => i.code === "cover")).toBe(true);
  });

  it("flags zero activities even when days exist", () => {
    const issues = checkPublishReadiness({ ...baseCtx, totalActivities: 0, daysWithoutActivity: 4 });
    expect(issues.some((i) => i.code === "activities")).toBe(true);
  });

  it("flags partial empty days", () => {
    const issues = checkPublishReadiness({ ...baseCtx, daysWithoutActivity: 1 });
    const empty = issues.find((i) => i.code === "empty-day");
    expect(empty).toBeDefined();
    expect(empty?.message).toMatch(/1 วัน/);
  });

  it("does NOT flag empty-day when there are zero activities total (avoids duplicate noise)", () => {
    const issues = checkPublishReadiness({ ...baseCtx, totalActivities: 0, daysWithoutActivity: 4 });
    expect(issues.find((i) => i.code === "empty-day")).toBeUndefined();
  });

  it("requires both outbound + return transport for international trips", () => {
    const issues = checkPublishReadiness({
      ...baseCtx,
      scope: "international",
      hasOutboundTransport: false,
      hasReturnTransport: false,
    });
    expect(issues.some((i) => i.code === "outbound")).toBe(true);
    expect(issues.some((i) => i.code === "return")).toBe(true);
  });

  it("does not require transport for domestic trips", () => {
    const issues = checkPublishReadiness({
      ...baseCtx,
      scope: "domestic",
      hasOutboundTransport: false,
      hasReturnTransport: false,
    });
    expect(issues.find((i) => i.code === "outbound")).toBeUndefined();
    expect(issues.find((i) => i.code === "return")).toBeUndefined();
  });

  it("each issue has a fixStep that points to a real wizard step", () => {
    const issues = checkPublishReadiness({
      ...baseCtx,
      title: "",
      destination: "",
      coverImageUrl: null,
      totalActivities: 0,
      daysCount: 0,
      daysWithoutActivity: 0,
    });
    for (const issue of issues) {
      expect(["basics", "activities", "preview"]).toContain(issue.fixStep);
    }
  });
});
