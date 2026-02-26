import { create } from "zustand";
import { Activity } from "@/constants/mockData";
import { CategoryId } from "@/constants/categories";
import { supabase } from "@/lib/supabase";

// ──────────────────────────────────────────────
// Cache configuration
// ──────────────────────────────────────────────
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ──────────────────────────────────────────────
// Supabase row type
// ──────────────────────────────────────────────
interface SupabaseEvent {
  id: string;
  mosque_id: string | null;
  mosque_name: string | null;
  mosque_city: string | null;
  title: string;
  description: string | null;
  category_id: string | null;
  type: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  day_of_week: number | null;
  instructor: string | null;
  image_url: string | null;
  time_anchor: string | null;
  prayer_id: string | null;
  prayer_offset: number | null;
}

// ──────────────────────────────────────────────
// Mapper: SupabaseEvent → Activity
// ──────────────────────────────────────────────
function mapSupabaseEventToActivity(row: SupabaseEvent): Activity {
  const type: "recurring" | "one_off" =
    row.type === "one_off" ? "one_off" : "recurring";

  return {
    id: row.id,
    mosqueId: row.mosque_id ?? "",
    mosqueName: row.mosque_name ?? undefined,
    mosqueCity: row.mosque_city ?? undefined,
    title: row.title,
    description: row.description ?? "",
    categoryId: (row.category_id as CategoryId) ?? "lecture",
    type,
    date: row.date ?? undefined,
    startTime: row.start_time ?? "",
    endTime: row.end_time ?? undefined,
    dayOfWeek: row.day_of_week ?? undefined,
    instructor: row.instructor ?? undefined,
    imageUrl: row.image_url ?? "",
    timeAnchor: (row.time_anchor as "fixed" | "prayer") ?? "fixed",
    prayerId: row.prayer_id ?? undefined,
    prayerOffset: row.prayer_offset ?? undefined,
  };
}

// ──────────────────────────────────────────────
// Fetch from Supabase
// ──────────────────────────────────────────────
async function fetchEventsFromAPI(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("events_activities")
    .select("*")
    .order("title");

  if (error) {
    throw new Error(error.message);
  }

  return (data as SupabaseEvent[]).map(mapSupabaseEventToActivity);
}

// ──────────────────────────────────────────────
// Store types
// ──────────────────────────────────────────────
interface EventsState {
  events: Activity[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchEvents: (forceRefresh?: boolean) => Promise<void>;
  getEventsByMosqueId: (mosqueId: string) => Activity[];
  invalidateCache: () => void;
  setEvents: (events: Activity[]) => void;
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────
export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchEvents: async (forceRefresh = false) => {
    const { lastFetched, isLoading } = get();

    if (isLoading) return;

    const isCacheFresh =
      lastFetched !== null && Date.now() - lastFetched < CACHE_DURATION;
    if (isCacheFresh && !forceRefresh) return;

    set({ isLoading: true, error: null });

    try {
      const events = await fetchEventsFromAPI();
      set({ events, isLoading: false, lastFetched: Date.now() });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch events",
        isLoading: false,
      });
    }
  },

  getEventsByMosqueId: (mosqueId: string) => {
    return get().events.filter((event) => event.mosqueId === mosqueId);
  },

  invalidateCache: () => {
    set({ lastFetched: null });
  },

  setEvents: (events: Activity[]) => {
    set({ events, lastFetched: Date.now(), error: null });
  },
}));
