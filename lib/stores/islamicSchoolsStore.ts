import { create } from "zustand";
import { IslamicSchool } from "@/constants/mockData";

// ──────────────────────────────────────────────
// Cache configuration
// ──────────────────────────────────────────────
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ──────────────────────────────────────────────
// WordPress REST API response type
// ──────────────────────────────────────────────

/** Raw quran_school object returned by the WordPress REST API */
export interface WPQuranSchool {
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
  acf: Record<string, unknown> | unknown[];
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
// Mapper: WPQuranSchool → IslamicSchool
// ──────────────────────────────────────────────
function mapWPSchoolToIslamicSchool(wp: WPQuranSchool): IslamicSchool {
  // Resolve featured image — prefer "large" size, fall back to source_url
  const media = wp._embedded?.["wp:featuredmedia"]?.[0];
  const imageUrl =
    media?.media_details?.sizes?.large?.source_url ?? media?.source_url ?? "";
  // Strip HTML tags from content
  const description = wp.content.rendered.replace(/<[^>]*>/g, "").trim();

  // Extract ACF fields if they exist (future-proof)
  const acf = Array.isArray(wp.acf) ? {} : (wp.acf ?? {});

  return {
    id: String(wp.id),
    name: wp.title.rendered,
    description,
    city: (acf.city as string) ?? "",
    address: (acf.address as string) ?? "",
    imageUrl,
    phone: (acf.phone as string) ?? undefined,
    email: (acf.email as string) ?? undefined,
    website: (acf.website as string) ?? undefined,
    founded: (acf.founded as string) ?? undefined,
    studentCount: (acf.student_count as number) ?? undefined,
    programs: Array.isArray(acf.programs) ? acf.programs : [],
    ageRange: (acf.age_range as string) ?? undefined,
    gender: (acf.gender as "male" | "female" | "mixed") ?? "mixed",
    latitude: (acf.latitude as number) ?? 0,
    longitude: (acf.longitude as number) ?? 0,
    mapsUrl: (acf.maps_url as string) ?? undefined,
  };
}

// ──────────────────────────────────────────────
// Fetch from WordPress REST API
// ──────────────────────────────────────────────
async function fetchSchoolsFromAPI(): Promise<IslamicSchool[]> {
  try {
    const response = await fetch(
      "https://www.masjidie.com/wp-json/wp/v2/quran_schools?_embed&per_page=100",
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: WPQuranSchool[] = await response.json();
    return data.map(mapWPSchoolToIslamicSchool);
  } catch (error) {
    console.error("Failed to fetch schools:", error);
    throw error;
  }
}

// ──────────────────────────────────────────────
// Store types
// ──────────────────────────────────────────────
interface IslamicSchoolsState {
  schools: IslamicSchool[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchSchools: (forceRefresh?: boolean) => Promise<void>;
  getSchoolById: (id: string) => IslamicSchool | undefined;
  invalidateCache: () => void;
  setSchools: (schools: IslamicSchool[]) => void;
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────
export const useIslamicSchoolsStore = create<IslamicSchoolsState>(
  (set, get) => ({
    schools: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    fetchSchools: async (forceRefresh = false) => {
      const { lastFetched, isLoading } = get();

      // Prevent duplicate concurrent fetches
      if (isLoading) return;

      // Return cached data if still fresh
      const isCacheFresh =
        lastFetched !== null && Date.now() - lastFetched < CACHE_DURATION;
      if (isCacheFresh && !forceRefresh) return;

      set({ isLoading: true, error: null });

      try {
        const schools = await fetchSchoolsFromAPI();
        set({ schools, isLoading: false, lastFetched: Date.now() });
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to fetch schools",
          isLoading: false,
        });
      }
    },

    getSchoolById: (id: string) => {
      return get().schools.find((s) => s.id === id);
    },

    invalidateCache: () => {
      set({ lastFetched: null });
    },

    setSchools: (schools: IslamicSchool[]) => {
      set({ schools, lastFetched: Date.now(), error: null });
    },
  }),
);
