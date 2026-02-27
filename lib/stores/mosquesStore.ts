import { Mosque } from "@/constants/mockData";
import { supabase } from "@/lib/supabase";
import { SupabaseMosque, mapSupabaseMosqueToMosque } from "@/lib/types/mosque";
import { create } from "zustand";

// ──────────────────────────────────────────────
// Cache configuration
// ──────────────────────────────────────────────
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ──────────────────────────────────────────────
// Fetch from Supabase
// ──────────────────────────────────────────────
async function fetchMosquesFromAPI(): Promise<Mosque[]> {
  const { data, error } = await supabase
    .from("mosques")
    .select("*")
    .order("name");
  if (error) {
    throw new Error(error.message);
  }

  return (data as SupabaseMosque[]).map(mapSupabaseMosqueToMosque);
}

// ──────────────────────────────────────────────
// Helper Functions for Coordinate Resolution
// ──────────────────────────────────────────────

export function extractCoordsFromUrl(
  url: string,
): { latitude: number; longitude: number } | null {
  try {
    // Pattern 1: @lat,lng (standard Maps URLs)
    const regex = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const match = url.match(regex);
    if (match && match.length >= 3) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
      };
    }

    // Pattern 2: ?q=lat,lng or ?ll=lat,lng
    const queryRegex = /[?&](?:q|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const queryMatch = url.match(queryRegex);
    if (queryMatch && queryMatch.length >= 3) {
      return {
        latitude: parseFloat(queryMatch[1]),
        longitude: parseFloat(queryMatch[2]),
      };
    }

    // Pattern 3: !3dlat!4dlng (Google Maps place/data URLs)
    const dataRegex = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/;
    const dataMatch = url.match(dataRegex);
    if (dataMatch && dataMatch.length >= 3) {
      return {
        latitude: parseFloat(dataMatch[1]),
        longitude: parseFloat(dataMatch[2]),
      };
    }

    return null;
  } catch (e) {
    return null;
  }
}

export async function resolveGoogleMapsLink(shortUrl: string): Promise<string> {
  try {
    // Use GET with redirect: "follow" (default) to resolve the full chain.
    // Some servers don't respond to HEAD correctly for short URLs.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(shortUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // response.url is the final URL after all redirects
    if (response.url && response.url !== shortUrl) {
      return response.url;
    }

    // Fallback: check for a meta-refresh or Location header in the body
    const text = await response.text();
    const metaMatch = text.match(/content=["']\d+;\s*url=([^"']+)["']/i);
    if (metaMatch && metaMatch[1]) {
      return metaMatch[1];
    }

    return response.url || shortUrl;
  } catch (error) {
    console.warn("Error resolving short URL:", error);
    return shortUrl;
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

    if (isLoading) return;

    const isCacheFresh =
      lastFetched !== null && Date.now() - lastFetched < CACHE_DURATION;
    if (isCacheFresh && !forceRefresh) return;

    set({ isLoading: true, error: null });

    try {
      const mosques = await fetchMosquesFromAPI();
      set({ mosques, isLoading: false, lastFetched: Date.now() });

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

    // Try to resolve coordinates from mapsUrl for ALL mosques that have one.
    // Priority: mapsUrl coordinates first, then fall back to DB lat/lng.
    const mosquesWithUrl = mosques.filter((m) => m.mapsUrl);

    if (mosquesWithUrl.length === 0) return;

    const updates = await Promise.all(
      mosquesWithUrl.map(async (mosque) => {
        try {
          let finalUrl = mosque.mapsUrl;

          // Resolve short links first
          if (
            mosque.mapsUrl.includes("goo.gl") ||
            mosque.mapsUrl.includes("app.goo.gl") ||
            mosque.mapsUrl.includes("share.google")
          ) {
            finalUrl = await resolveGoogleMapsLink(mosque.mapsUrl);
          }

          // Try extracting coords from the URL
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
        // URL extraction failed — keep existing lat/lng (no update needed)
        return null;
      }),
    );

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
