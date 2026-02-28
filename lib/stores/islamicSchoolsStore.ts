import { create } from "zustand";
import { IslamicSchool } from "@/constants/mockData";
import {
  CACHE_DURATION,
  fetchWithRetry,
  loadPersistentCache,
  persistCache,
} from "@/lib/fetchUtils";
import { supabase } from "@/lib/supabase";

const CACHE_KEY = "schools";

// ──────────────────────────────────────────────
// Supabase row type
// ──────────────────────────────────────────────
interface SupabaseQuranSchool {
  id: string;
  mosque_id: string | null;
  name: string;
  description: string | null;
  city: string | null;
  address: string | null;
  image_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  founded: string | null;
  student_count: number | null;
  programs: string[] | null;
  age_range: string | null;
  gender: string | null;
  latitude: number | null;
  longitude: number | null;
  maps_url: string | null;
}

// ──────────────────────────────────────────────
// Mapper: SupabaseQuranSchool → IslamicSchool
// ──────────────────────────────────────────────
function mapSupabaseSchoolToIslamicSchool(
  row: SupabaseQuranSchool,
): IslamicSchool {
  return {
    id: row.id,
    mosqueId: row.mosque_id ?? undefined,
    name: row.name,
    description: row.description ?? "",
    city: row.city ?? "",
    address: row.address ?? "",
    imageUrl: row.image_url ?? "",
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    founded: row.founded ?? undefined,
    studentCount: row.student_count ?? undefined,
    programs: row.programs ?? [],
    ageRange: row.age_range ?? undefined,
    gender: (row.gender as "male" | "female" | "mixed") ?? "mixed",
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    mapsUrl: row.maps_url ?? undefined,
  };
}

// ──────────────────────────────────────────────
// Fetch from Supabase
// ──────────────────────────────────────────────
async function fetchSchoolsFromAPI(): Promise<IslamicSchool[]> {
  const { data, error } = await supabase
    .from("quran_schools")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data as SupabaseQuranSchool[]).map(mapSupabaseSchoolToIslamicSchool);
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
  getSchoolByMosqueId: (mosqueId: string) => IslamicSchool | undefined;
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
      const { lastFetched, isLoading, schools: currentSchools } = get();

      if (isLoading) return;

      // 1. If in-memory data is empty, load from persistent cache
      if (currentSchools.length === 0) {
        const cached = await loadPersistentCache<IslamicSchool[]>(CACHE_KEY);
        if (cached) {
          set({ schools: cached.data, lastFetched: cached.timestamp });
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
      const hasStaleData = get().schools.length > 0;
      if (!hasStaleData) {
        set({ isLoading: true });
      }
      set({ error: null });

      try {
        const schools = await fetchWithRetry(fetchSchoolsFromAPI);
        set({ schools, isLoading: false, lastFetched: Date.now() });
        persistCache(CACHE_KEY, schools);
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

    getSchoolByMosqueId: (mosqueId: string) => {
      return get().schools.find((s) => s.mosqueId === mosqueId);
    },

    invalidateCache: () => {
      set({ lastFetched: null });
    },

    setSchools: (schools: IslamicSchool[]) => {
      set({ schools, lastFetched: Date.now(), error: null });
    },
  }),
);
