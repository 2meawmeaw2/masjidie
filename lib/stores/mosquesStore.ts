import { create } from "zustand";
import { Mosque } from "@/constants/mockData";

// ──────────────────────────────────────────────
// Cache configuration
// ──────────────────────────────────────────────
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ──────────────────────────────────────────────
// WordPress REST API response types
// ──────────────────────────────────────────────

/** ACF fields returned for the mosques custom post type */
export interface WPMosqueACF {
  id?: string;
  name?: string;
  state_?: string;
  commune?: string;
  url?: string;
  related?: string;
  description?: string;
  capacity?: string;
  imam?: string;
  services?: string;
  longitude?: string;
  latitude?: string;
  picurl?: number | string;
  [key: string]: unknown;
}

/** Raw mosque object returned by the WordPress REST API */
export interface WPMosque {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  featured_media: number;
  template: string;
  acf: WPMosqueACF | unknown[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      id: number;
      source_url: string;
      media_details?: {
        width: number;
        height: number;
        sizes?: Record<
          string,
          {
            source_url: string;
            width: number;
            height: number;
          }
        >;
      };
    }>;
  };
}

// ──────────────────────────────────────────────
// Type guard
// ──────────────────────────────────────────────
function isACFObject(acf: WPMosqueACF | unknown[]): acf is WPMosqueACF {
  return acf !== null && !Array.isArray(acf) && typeof acf === "object";
}

// ──────────────────────────────────────────────
// Mapper: WPMosque → Mosque
// ──────────────────────────────────────────────
function mapWPMosqueToMosque(wp: WPMosque): Mosque {
  const acf = isACFObject(wp.acf) ? wp.acf : undefined;
  // Resolve image: prefer ACF picurl (if it's a URL string), then featured media
  const picUrl = typeof acf?.picurl === "string" ? acf.picurl : "";
  const featuredImage =
    wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? "";

  const imageUrl = picUrl || featuredImage || "";
  console.log("imageUrl", imageUrl);

  // Parse coordinates
  // Strategy:
  // 1. Try to extract from maps URL if it's a full URL (contains @lat,lng)
  // 2. Fallback to ACF latitude/longitude
  // 3. Default to 0

  const mapsUrl = acf?.url ?? "";
  let latitude = 0;
  let longitude = 0;

  // Try extracting from URL first if possible without network request
  const urlCoords = extractCoordsFromUrl(mapsUrl);
  if (urlCoords) {
    latitude = urlCoords.latitude;
    longitude = urlCoords.longitude;
  } else {
    // Fallback to ACF manual entry
    const rawLat = acf?.latitude;
    const rawLng = acf?.longitude;
    latitude = typeof rawLat === "string" ? parseFloat(rawLat) || 0 : 0;
    longitude = typeof rawLng === "string" ? parseFloat(rawLng) || 0 : 0;
  }

  return {
    id: String(wp.id),
    name: acf?.name ?? wp.title.rendered,
    address: acf?.commune ?? "",
    city: acf?.state_ ?? "",
    distance: 0, // calculated client-side from user location
    imageUrl,
    mapsUrl: acf?.url ?? "",
    latitude,
    longitude,
    description:
      acf?.description ?? wp.content.rendered.replace(/<[^>]*>/g, "").trim(),
    // Extended ACF fields
    imam: acf?.imam ?? undefined,
    capacity: acf?.capacity ?? undefined,
    services: acf?.services ?? undefined,
  };
}

// ──────────────────────────────────────────────
// Fetch from WordPress REST API
// ──────────────────────────────────────────────
async function fetchMosquesFromAPI(): Promise<Mosque[]> {
  try {
    const response = await fetch(
      "https://www.masjidie.com/wp-json/wp/v2/mosques?_embed&per_page=100",
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: WPMosque[] = await response.json();
    return data.map(mapWPMosqueToMosque);
  } catch (error) {
    console.error("Failed to fetch mosques:", error);
    throw error;
  }
}

// ──────────────────────────────────────────────
// Store types
// ──────────────────────────────────────────────
interface MosquesState {
  mosques: Mosque[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchMosques: (forceRefresh?: boolean) => Promise<void>;
  resolveMissingCoordinates: () => Promise<void>;
  getMosqueById: (id: string) => Mosque | undefined;
  invalidateCache: () => void;
  setMosques: (mosques: Mosque[]) => void;
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────
export const useMosquesStore = create<MosquesState>((set, get) => ({
  mosques: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchMosques: async (forceRefresh = false) => {
    const { lastFetched, isLoading } = get();

    // Prevent duplicate concurrent fetches
    if (isLoading) return;

    // Return cached data if still fresh
    const isCacheFresh =
      lastFetched !== null && Date.now() - lastFetched < CACHE_DURATION;
    if (isCacheFresh && !forceRefresh) return;

    set({ isLoading: true, error: null });

    try {
      const mosques = await fetchMosquesFromAPI();
      set({ mosques, isLoading: false, lastFetched: Date.now() });

      // Trigger background resolution for coordinates from URLs
      get().resolveMissingCoordinates();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch mosques",
        isLoading: false,
      });
    }
  },

  resolveMissingCoordinates: async () => {
    const { mosques } = get();
    // Identify mosques that have a mapsUrl but might need coordinate resolution
    // We prioritize the URL, so we check any mosque with a URL.
    // To save bandwidth, we could only check those with (0,0), but the user requested priority on URL.
    // For performance, let's prioritize resolving those that are currently (0,0) or have a short link.

    const mosquesToResolve = mosques.filter((m) => {
      // If we already have coords from a full URL in the mapper, we might skip,
      // but if it's a short link that hasn't been expanded, we need to do it.
      const isShortLink =
        m.mapsUrl.includes("goo.gl") || m.mapsUrl.includes("maps.app.goo.gl");
      const hasMissingCoords = m.latitude === 0 && m.longitude === 0;

      return m.mapsUrl && (isShortLink || hasMissingCoords);
    });

    if (mosquesToResolve.length === 0) return;

    // Resolve in parallel (with some concurrency limit if needed, but for now Promise.all is okay for small sets)
    const updates = await Promise.all(
      mosquesToResolve.map(async (mosque) => {
        try {
          let finalUrl = mosque.mapsUrl;

          // If it looks like a short link, fetch HEAD to get resolved URL
          if (
            mosque.mapsUrl.includes("goo.gl") ||
            mosque.mapsUrl.includes("app.goo.gl")
          ) {
            finalUrl = await resolveGoogleMapsLink(mosque.mapsUrl);
          }

          const coords = extractCoordsFromUrl(finalUrl);
          if (coords) {
            return { id: mosque.id, ...coords };
          }
        } catch (err) {
          console.warn(
            `Failed to resolve coords for mosque ${mosque.name}`,
            err,
          );
        }
        return null;
      }),
    );

    // Apply updates
    const validUpdates = updates.filter(Boolean) as {
      id: string;
      latitude: number;
      longitude: number;
    }[];

    if (validUpdates.length > 0) {
      set((state) => ({
        mosques: state.mosques.map((m) => {
          const update = validUpdates.find((u) => u.id === m.id);
          if (update) {
            return {
              ...m,
              latitude: update.latitude,
              longitude: update.longitude,
            };
          }
          return m;
        }),
      }));
    }
  },

  getMosqueById: (id: string) => {
    return get().mosques.find((m) => m.id === id);
  },

  invalidateCache: () => {
    set({ lastFetched: null });
  },

  setMosques: (mosques: Mosque[]) => {
    set({ mosques, lastFetched: Date.now(), error: null });
  },
}));

// ──────────────────────────────────────────────
// Helper Functions for Coordinate Resolution
// ──────────────────────────────────────────────

/**
 * Extracts latitude and longitude from a Google Maps URL.
 * Supports standard /@lat,lng/ format.
 */
function extractCoordsFromUrl(
  url: string,
): { latitude: number; longitude: number } | null {
  try {
    // Look for pattern /@36.7395,3.3409/ in URL
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match && match.length >= 3) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
      };
    }

    // Sometimes coords are in query params ?q=lat,lng or &ll=lat,lng (less common in modern share links but possible)
    const queryRegex = /[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const queryMatch = url.match(queryRegex);
    if (queryMatch && queryMatch.length >= 3) {
      return {
        latitude: parseFloat(queryMatch[1]),
        longitude: parseFloat(queryMatch[2]),
      };
    }

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Resolves a short Google Maps URL (e.g. maps.app.goo.gl) to its full destination URL
 * by following redirects.
 */
async function resolveGoogleMapsLink(shortUrl: string): Promise<string> {
  try {
    const response = await fetch(shortUrl, { method: "HEAD" });
    // response.url contains the final URL after redirects
    return response.url;
  } catch (error) {
    console.warn("Error resolving short URL:", error);
    return shortUrl; // Return original if fail, maybe extraction works partially or retry later
  }
}
