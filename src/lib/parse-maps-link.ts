/**
 * Extract {lat, lng} from common Google Maps URL formats.
 * Returns null if the URL cannot be parsed or is not a Google Maps link.
 *
 * Handled patterns:
 *  - /maps/place/.../@lat,lng,zoom/
 *  - /maps/search/.../@lat,lng,zoom/
 *  - ?q=lat,lng
 *  - ?ll=lat,lng
 *  - maps.google.*?q=lat,lng
 */
export function parseMapsLink(url: string | null | undefined): { lat: number; lng: number } | null {
  if (!url) return null;

  try {
    // @lat,lng,zoom — used in /place/ and /search/ paths
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }

    const parsed = new URL(url);
    const q = parsed.searchParams.get("q");
    if (q) {
      const parts = q.split(",");
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (isFinite(lat) && isFinite(lng)) return { lat, lng };
      }
    }

    const ll = parsed.searchParams.get("ll");
    if (ll) {
      const parts = ll.split(",");
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (isFinite(lat) && isFinite(lng)) return { lat, lng };
      }
    }
  } catch {
    // invalid URL
  }

  return null;
}

export function resolveCoords(
  lat: number | null | undefined,
  lng: number | null | undefined,
  mapsLink: string | null | undefined,
): { lat: number; lng: number } | null {
  if (lat != null && lng != null && isFinite(lat) && isFinite(lng)) return { lat, lng };
  return parseMapsLink(mapsLink);
}
