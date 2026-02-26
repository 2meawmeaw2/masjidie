import { create } from "zustand";
import { Mosque } from "@/constants/mockData";
import { supabase } from "@/lib/supabase";

// ──────────────────────────────────────────────
// Cache configuration
// ──────────────────────────────────────────────
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ──────────────────────────────────────────────
// Supabase row type
// ──────────────────────────────────────────────
interface SupabaseMosque {
  id: string;
  name: string;
  address: string;
  city: string;
  image_url: string;
  maps_url: string;
  latitude: number;
  longitude: number;
  description: string | null;
  imam: string | null;
  capacity: string | null;
  services: string | null;
}

// ──────────────────────────────────────────────
// Mapper: SupabaseMosque → Mosque
// ──────────────────────────────────────────────
function mapSupabaseMosqueToMosque(row: SupabaseMosque): Mosque {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? "",
    city: row.city ?? "",
    distance: 0, // calculated client-side from user location
    imageUrl: row.image_url ?? "",
    mapsUrl: row.maps_url ?? "",
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    description: row.description ?? undefined,
    imam: row.imam ?? undefined,
    capacity: row.capacity ?? undefined,
    services: row.services ?? undefined,
  };
}

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

function extractCoordsFromUrl(
  url: string,
): { latitude: number; longitude: number } | null {
  try {
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match && match.length >= 3) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
      };
    }

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

async function resolveGoogleMapsLink(shortUrl: string): Promise<string> {
  try {
    const response = await fetch(shortUrl, { method: "HEAD" });
    return response.url;
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

    const mosquesToResolve = mosques.filter((m) => {
      const isShortLink =
        m.mapsUrl.includes("goo.gl") || m.mapsUrl.includes("maps.app.goo.gl");
      const hasMissingCoords = m.latitude === 0 && m.longitude === 0;

      return m.mapsUrl && (isShortLink || hasMissingCoords);
    });

    if (mosquesToResolve.length === 0) return;

    const updates = await Promise.all(
      mosquesToResolve.map(async (mosque) => {
        try {
          let finalUrl = mosque.mapsUrl;

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
