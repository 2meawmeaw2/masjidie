import { Mosque } from "@/constants/mockData";
import {
  CACHE_DURATION,
  fetchWithRetry,
  loadPersistentCache,
  persistCache,
} from "@/lib/fetchUtils";
import { extractCoordsFromUrl, resolveGoogleMapsLink } from "@/lib/location";
import { supabase } from "@/lib/supabase";
import { SupabaseMosque, mapSupabaseMosqueToMosque } from "@/lib/types/mosque";
import { create } from "zustand";

// Re-export for backwards compatibility
export { extractCoordsFromUrl, resolveGoogleMapsLink };

const CACHE_KEY = "mosques";

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
    const { lastFetched, isLoading, mosques: currentMosques } = get();

    if (isLoading) return;

    // 1. If in-memory data is empty, load from persistent cache
    if (currentMosques.length === 0) {
      const cached = await loadPersistentCache<Mosque[]>(CACHE_KEY);
      if (cached) {
        set({ mosques: cached.data, lastFetched: cached.timestamp });
        // If persistent cache is fresh and not force-refresh, stop
        if (!forceRefresh && Date.now() - cached.timestamp < CACHE_DURATION) {
          return;
        }
      }
    }

    // 2. If in-memory cache is fresh, stop
    const isCacheFresh =
      lastFetched !== null && Date.now() - lastFetched < CACHE_DURATION;
    if (isCacheFresh && !forceRefresh) return;

    // 3. Stale data exists → fetch in background (no loading spinner)
    const hasStaleData = get().mosques.length > 0;
    if (!hasStaleData) {
      set({ isLoading: true });
    }
    set({ error: null });

    try {
      const mosques = await fetchWithRetry(fetchMosquesFromAPI);
      set({ mosques, isLoading: false, lastFetched: Date.now() });
      persistCache(CACHE_KEY, mosques);

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
