import { describe, it, expect } from "vitest";
import { lookupEmergencyPrefill } from "./emergency-contacts";

describe("lookupEmergencyPrefill", () => {
  it("returns null for empty / unrecognised destinations", () => {
    expect(lookupEmergencyPrefill("")).toBeNull();
    expect(lookupEmergencyPrefill("Atlantis")).toBeNull();
  });

  it("matches first-token English country names", () => {
    const set = lookupEmergencyPrefill("Japan");
    expect(set).not.toBeNull();
    expect(set?.police.phone).toBe("110");
  });

  it("matches the comma-separated form 'Country, City'", () => {
    const set = lookupEmergencyPrefill("Korea, Seoul");
    expect(set?.embassy.name).toMatch(/โซล/);
  });

  it("resolves Thai aliases", () => {
    expect(lookupEmergencyPrefill("ญี่ปุ่น")?.embassy.name).toMatch(/โตเกียว/);
    expect(lookupEmergencyPrefill("ฮ่องกง")?.embassy.name).toMatch(/ฮ่องกง/);
  });

  it("falls back to substring scan when no leading country token", () => {
    // "Tokyo trip 2026" → matches via alias "โตเกียว"? No, that alias
    // is Thai script; the scan also matches English "japan" if present.
    // Test the English scan path.
    const tokyo = lookupEmergencyPrefill("Trip to Tokyo");
    // No "japan" or "tokyo" alias in English keys, expect null — verifies
    // we don't fuzzy-match too aggressively.
    expect(tokyo).toBeNull();

    // But the explicit alias chain works:
    expect(lookupEmergencyPrefill("Trip to โตเกียว next month")?.police.phone).toBe("110");
  });

  it("treats Bali as distinct from Indonesia (consulate vs embassy)", () => {
    const bali = lookupEmergencyPrefill("Bali");
    const indo = lookupEmergencyPrefill("Indonesia");
    expect(bali?.embassy.name).toMatch(/บาหลี/);
    expect(indo?.embassy.name).toMatch(/จาการ์ตา/);
  });

  it("is case-insensitive", () => {
    expect(lookupEmergencyPrefill("japan")?.police.phone).toBe("110");
    expect(lookupEmergencyPrefill("JAPAN")?.police.phone).toBe("110");
    expect(lookupEmergencyPrefill("Japan")?.police.phone).toBe("110");
  });
});
