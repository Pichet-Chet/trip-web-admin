import { describe, it, expect, vi, beforeEach } from "vitest";
import { mapTripResponse, type TripPublicResponse } from "./trip-api";

// ── helpers ────────────────────────────────────────────────────────────────

function baseResponse(overrides: Partial<TripPublicResponse> = {}): TripPublicResponse {
  return {
    id: "trip-001",
    title: "Osaka Trip",
    slug: "co/osaka-trip",
    destination: "Osaka, Japan",
    startDate: "2026-06-01",
    endDate: "2026-06-07",
    coverImageUrl: null,
    travelersCount: 12,
    language: "TH",                // uppercase — must be lowercased by mapper
    airlineInfo: [],
    accommodations: [],
    emergencyContacts: [],
    checklistItems: [],
    importantNotes: null,
    viewCount: 42,
    showWatermark: false,
    supportedLanguages: ["th", "en"],
    company: {
      name: "TravelCo",
      logoUrl: null,
      phone: null,
      lineId: null,
    },
    days: [],
    ...overrides,
  };
}

function baseActivity(overrides: Partial<TripPublicResponse["days"][0]["activities"][0]> = {}) {
  return {
    id: "act-1",
    time: "09:00",
    name: "Osaka Castle",
    description: "Historic castle",
    type: "attraction",
    placeName: "Osaka",
    lat: 34.687,
    lng: 135.526,
    mapsLink: "https://maps.google.com/?q=1",
    imageUrl: "https://example.com/castle.jpg",
    imageUrls: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
    emoji: "🏯",
    ...overrides,
  };
}

// ── mapTripResponse — scalar fields ───────────────────────────────────────

describe("mapTripResponse — scalar fields", () => {
  it("passes id, title, slug, destination, dates through unchanged", () => {
    const trip = mapTripResponse(baseResponse());
    expect(trip.id).toBe("trip-001");
    expect(trip.title).toBe("Osaka Trip");
    expect(trip.slug).toBe("co/osaka-trip");
    expect(trip.destination).toBe("Osaka, Japan");
    expect(trip.startDate).toBe("2026-06-01");
    expect(trip.endDate).toBe("2026-06-07");
  });

  it("lowercases language", () => {
    const trip = mapTripResponse(baseResponse({ language: "TH" }));
    expect(trip.language).toBe("th");
  });

  it("defaults language to 'th' when missing", () => {
    const trip = mapTripResponse(baseResponse({ language: undefined as unknown as string }));
    expect(trip.language).toBe("th");
  });

  it("converts null coverImageUrl to empty string", () => {
    const trip = mapTripResponse(baseResponse({ coverImageUrl: null }));
    expect(trip.coverImageUrl).toBe("");
  });

  it("preserves coverImageUrl when present", () => {
    const trip = mapTripResponse(baseResponse({ coverImageUrl: "https://img.example.com/cover.jpg" }));
    expect(trip.coverImageUrl).toBe("https://img.example.com/cover.jpg");
  });

  it("converts null importantNotes to empty string", () => {
    const trip = mapTripResponse(baseResponse({ importantNotes: null }));
    expect(trip.notes).toBe("");
  });

  it("passes importantNotes through when present", () => {
    const trip = mapTripResponse(baseResponse({ importantNotes: "Bring sunscreen" }));
    expect(trip.notes).toBe("Bring sunscreen");
  });

  it("sets status to 'published'", () => {
    const trip = mapTripResponse(baseResponse());
    expect(trip.status).toBe("published");
  });

  it("sets followerCount to 0", () => {
    const trip = mapTripResponse(baseResponse());
    expect(trip.followerCount).toBe(0);
  });

  it("sets pendingChange to null", () => {
    const trip = mapTripResponse(baseResponse());
    expect(trip.pendingChange).toBeNull();
  });

  it("passes showWatermark through", () => {
    expect(mapTripResponse(baseResponse({ showWatermark: true })).showWatermark).toBe(true);
    expect(mapTripResponse(baseResponse({ showWatermark: false })).showWatermark).toBe(false);
  });

  it("passes supportedLanguages through", () => {
    const trip = mapTripResponse(baseResponse({ supportedLanguages: ["th", "en", "ja"] }));
    expect(trip.supportedLanguages).toEqual(["th", "en", "ja"]);
  });

  it("defaults supportedLanguages to [] when missing", () => {
    const trip = mapTripResponse(baseResponse({ supportedLanguages: undefined }));
    expect(trip.supportedLanguages).toEqual([]);
  });
});

// ── mapTripResponse — company ─────────────────────────────────────────────

describe("mapTripResponse — company", () => {
  it("maps company name", () => {
    const trip = mapTripResponse(baseResponse());
    expect(trip.company.name).toBe("TravelCo");
  });

  it("converts null company fields to empty strings", () => {
    const trip = mapTripResponse(baseResponse({
      company: { name: "Co", logoUrl: null, phone: null, lineId: null },
    }));
    expect(trip.company.logoUrl).toBe("");
    expect(trip.company.phone).toBe("");
    expect(trip.company.lineId).toBe("");
  });

  it("sets facebook/instagram/website/tatLicense to empty string", () => {
    const trip = mapTripResponse(baseResponse());
    expect(trip.company.facebook).toBe("");
    expect(trip.company.instagram).toBe("");
    expect(trip.company.website).toBe("");
    expect(trip.company.tatLicense).toBe("");
  });
});

// ── mapTripResponse — activities ──────────────────────────────────────────

describe("mapTripResponse — activity type mapping", () => {
  function makeWithActivity(type: string) {
    return baseResponse({
      days: [{
        id: "d1", dayNumber: 1, title: "Day 1",
        subtitle: null, coverImageUrl: null, date: "2026-06-01",
        activities: [baseActivity({ type })],
      }],
    });
  }

  it.each(["attraction", "restaurant", "hotel", "transport", "shopping", "other"])(
    "passes through valid type '%s'",
    (type) => {
      const trip = mapTripResponse(makeWithActivity(type));
      expect(trip.days[0].activities[0].type).toBe(type);
    }
  );

  it("lowercases activity type before validation", () => {
    const trip = mapTripResponse(makeWithActivity("ATTRACTION"));
    expect(trip.days[0].activities[0].type).toBe("attraction");
  });

  it("falls back to 'other' for unknown activity types", () => {
    const trip = mapTripResponse(makeWithActivity("sightseeing"));
    expect(trip.days[0].activities[0].type).toBe("other");
  });

  it("falls back to 'other' for empty type", () => {
    const trip = mapTripResponse(makeWithActivity(""));
    expect(trip.days[0].activities[0].type).toBe("other");
  });

  it("uses imageUrls when imageUrl is null", () => {
    const trip = mapTripResponse(baseResponse({
      days: [{
        id: "d1", dayNumber: 1, title: "Day 1",
        subtitle: null, coverImageUrl: null, date: null,
        activities: [baseActivity({ imageUrl: null, imageUrls: ["https://img.example.com/a.jpg"] })],
      }],
    }));
    expect(trip.days[0].activities[0].imageUrl).toBe("https://img.example.com/a.jpg");
  });

  it("prefers imageUrl over imageUrls[0]", () => {
    const trip = mapTripResponse(baseResponse({
      days: [{
        id: "d1", dayNumber: 1, title: "Day 1",
        subtitle: null, coverImageUrl: null, date: null,
        activities: [baseActivity({
          imageUrl: "https://img.example.com/primary.jpg",
          imageUrls: ["https://img.example.com/secondary.jpg"],
        })],
      }],
    }));
    expect(trip.days[0].activities[0].imageUrl).toBe("https://img.example.com/primary.jpg");
  });

  it("sets sortOrder from array index", () => {
    const trip = mapTripResponse(baseResponse({
      days: [{
        id: "d1", dayNumber: 1, title: "Day 1",
        subtitle: null, coverImageUrl: null, date: null,
        activities: [baseActivity(), baseActivity({ id: "act-2", name: "Lunch" })],
      }],
    }));
    expect(trip.days[0].activities[0].sortOrder).toBe(0);
    expect(trip.days[0].activities[1].sortOrder).toBe(1);
  });

  it("converts null nullable fields to empty string", () => {
    const trip = mapTripResponse(baseResponse({
      days: [{
        id: "d1", dayNumber: 1, title: "Day 1",
        subtitle: null, coverImageUrl: null, date: null,
        activities: [baseActivity({
          time: null, description: null, placeName: null,
          mapsLink: null, imageUrl: null, imageUrls: null, emoji: null,
        })],
      }],
    }));
    const act = trip.days[0].activities[0];
    expect(act.time).toBe("");
    expect(act.description).toBe("");
    expect(act.placeName).toBe("");
    expect(act.mapsLink).toBe("");
    expect(act.imageUrl).toBe("");
    expect(act.emoji).toBe("");
  });
});

// ── mapTripResponse — airline type mapping ────────────────────────────────

describe("mapTripResponse — airline type mapping", () => {
  function makeWithAirlines(airlines: TripPublicResponse["airlineInfo"]) {
    return mapTripResponse(baseResponse({ airlineInfo: airlines }));
  }

  it.each(["departure", "return", "transit"])("passes through valid type '%s'", (type) => {
    const trip = makeWithAirlines([{ type, airline: "ANA", flightNumber: "NH201" }]);
    expect(trip.airlineInfo[0].type).toBe(type);
  });

  it("defaults first airline to 'departure' when type is unknown", () => {
    const trip = makeWithAirlines([{ type: "unknown", airline: "ANA" }]);
    expect(trip.airlineInfo[0].type).toBe("departure");
  });

  it("defaults second airline to 'return' when type is unknown", () => {
    const trip = makeWithAirlines([
      { type: "departure", airline: "ANA" },
      { type: "unknown", airline: "ANA" },
    ]);
    expect(trip.airlineInfo[1].type).toBe("return");
  });

  it("lowercases type before validation", () => {
    const trip = makeWithAirlines([{ type: "DEPARTURE", airline: "ANA" }]);
    expect(trip.airlineInfo[0].type).toBe("departure");
  });

  it("converts null airline fields to empty strings", () => {
    const trip = makeWithAirlines([{
      airline: null, flightNumber: null,
      departureTime: null, arrivalTime: null,
      departureAirport: null, arrivalAirport: null, type: "departure",
    }]);
    const a = trip.airlineInfo[0];
    expect(a.airline).toBe("");
    expect(a.flightNumber).toBe("");
    expect(a.departureTime).toBe("");
    expect(a.arrivalTime).toBe("");
    expect(a.departureAirport).toBe("");
    expect(a.arrivalAirport).toBe("");
  });
});

// ── mapTripResponse — checklist ────────────────────────────────────────────

describe("mapTripResponse — checklist", () => {
  it("maps checklist items correctly", () => {
    const trip = mapTripResponse(baseResponse({
      checklistItems: [
        { id: "c1", label: "Passport", isRequired: true, sortOrder: 0 },
        { id: "c2", label: "Travel insurance", isRequired: false, sortOrder: 1 },
      ],
    }));
    expect(trip.checklistItems).toHaveLength(2);
    expect(trip.checklistItems[0]).toEqual({ id: "c1", label: "Passport", isRequired: true, sortOrder: 0 });
  });

  it("defaults checklistItems to [] when missing from response", () => {
    const trip = mapTripResponse(baseResponse({
      checklistItems: undefined as unknown as [],
    }));
    expect(trip.checklistItems).toEqual([]);
  });
});

// ── mapTripResponse — empty arrays ────────────────────────────────────────

describe("mapTripResponse — empty array defaults", () => {
  it("returns empty arrays for missing collections", () => {
    const trip = mapTripResponse(baseResponse({
      airlineInfo: [],
      accommodations: [],
      emergencyContacts: [],
      checklistItems: [],
      days: [],
    }));
    expect(trip.airlineInfo).toEqual([]);
    expect(trip.accommodations).toEqual([]);
    expect(trip.emergencyContacts).toEqual([]);
    expect(trip.checklistItems).toEqual([]);
    expect(trip.days).toEqual([]);
    expect(trip.changelogs).toEqual([]);
  });
});

// ── mapTripResponse — accommodation ──────────────────────────────────────

describe("mapTripResponse — accommodation", () => {
  it("maps accommodation fields and converts nulls to empty strings", () => {
    const trip = mapTripResponse(baseResponse({
      accommodations: [{
        name: "Osaka Hotel",
        address: null, phone: null, checkIn: null, checkOut: null,
        nights: 3,
      }],
    }));
    const a = trip.accommodations[0];
    expect(a.name).toBe("Osaka Hotel");
    expect(a.address).toBe("");
    expect(a.phone).toBe("");
    expect(a.checkIn).toBe("");
    expect(a.checkOut).toBe("");
    expect(a.nights).toBe(3);
  });
});

// ── mapTripResponse — emergency contacts ─────────────────────────────────

describe("mapTripResponse — emergency contacts", () => {
  it("maps emergency contact fields", () => {
    const trip = mapTripResponse(baseResponse({
      emergencyContacts: [{ name: "Tourist Police", phone: "1155", icon: "🚔", sortOrder: 0 }],
    }));
    expect(trip.emergencyContacts[0]).toEqual({
      name: "Tourist Police", phone: "1155", icon: "🚔", sortOrder: 0,
    });
  });

  it("defaults null icon to the fallback emoji", () => {
    const trip = mapTripResponse(baseResponse({
      emergencyContacts: [{ name: "Ambulance", phone: "1669", icon: null, sortOrder: 0 }],
    }));
    expect(trip.emergencyContacts[0].icon).toBe("🚨");
  });
});

// ── fetchTripBySlug + acknowledgeChangelog — network calls ────────────────

describe("fetchTripBySlug", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("calls api.get with correct URL (no lang)", async () => {
    const mockGet = vi.fn().mockResolvedValue(baseResponse());
    vi.doMock("./client-api", () => ({ api: { get: mockGet }, ApiError: class extends Error {} }));

    const { fetchTripBySlug } = await import("./trip-api");
    await fetchTripBySlug("co/osaka-trip");

    expect(mockGet).toHaveBeenCalledWith("/client/t/co%2Fosaka-trip");
  });

  it("appends lang query param when provided", async () => {
    const mockGet = vi.fn().mockResolvedValue(baseResponse());
    vi.doMock("./client-api", () => ({ api: { get: mockGet }, ApiError: class extends Error {} }));

    const { fetchTripBySlug } = await import("./trip-api");
    await fetchTripBySlug("co/osaka-trip", "en");

    expect(mockGet).toHaveBeenCalledWith("/client/t/co%2Fosaka-trip?lang=en");
  });

  it("returns a mapped TripPlan (not raw API shape)", async () => {
    const mockGet = vi.fn().mockResolvedValue(baseResponse({ language: "TH" }));
    vi.doMock("./client-api", () => ({ api: { get: mockGet }, ApiError: class extends Error {} }));

    const { fetchTripBySlug } = await import("./trip-api");
    const result = await fetchTripBySlug("any-slug");

    expect(result.language).toBe("th");       // mapper lowercased it
    expect(result.status).toBe("published");  // mapper set status
  });
});

describe("acknowledgeChangelog", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("calls api.post with changelogId and followerId", async () => {
    const mockPost = vi.fn().mockResolvedValue({ id: "ack-1", acknowledgedAt: "2026-06-01T00:00:00Z" });
    vi.doMock("./client-api", () => ({ api: { post: mockPost }, ApiError: class extends Error {} }));

    const { acknowledgeChangelog } = await import("./trip-api");
    const result = await acknowledgeChangelog("cl-abc", "follower-xyz");

    expect(mockPost).toHaveBeenCalledWith(
      "/client/acknowledge/cl-abc",
      { followerId: "follower-xyz" }
    );
    expect(result.id).toBe("ack-1");
  });

  it("URL-encodes changelogId with special characters", async () => {
    const mockPost = vi.fn().mockResolvedValue({ id: "x", acknowledgedAt: "" });
    vi.doMock("./client-api", () => ({ api: { post: mockPost }, ApiError: class extends Error {} }));

    const { acknowledgeChangelog } = await import("./trip-api");
    await acknowledgeChangelog("id/with/slash", "f1");

    expect(mockPost).toHaveBeenCalledWith(
      "/client/acknowledge/id%2Fwith%2Fslash",
      expect.anything()
    );
  });
});
