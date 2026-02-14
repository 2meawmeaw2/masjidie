import { create } from "zustand";
import { Activity } from "@/constants/mockData";
import { CategoryId } from "@/constants/categories";

// ──────────────────────────────────────────────
// Cache configuration
// ──────────────────────────────────────────────
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ──────────────────────────────────────────────
// WordPress REST API response types
// ──────────────────────────────────────────────

/** ACF fields returned for events_activities (field group: events activities fields) */
export interface WPEventACF {
  mosque_name?: string;
  mosqueId?: string;
  id?: number | string;
  mosque_city?: string;
  instructor?: string;
  start_time?: string;
  end_time?: string;
  day_of_week?: number | string;
  event_type?: string;
  description?: string;
  // Catch-all for any other ACF fields
  [key: string]: unknown;
}

/** Raw event object returned by the WordPress REST API */
export interface WPEvent {
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
  events_and_activities_categories: number[];
  acf: WPEventACF | unknown[];
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
// WP category ID → app CategoryId mapping
// ──────────────────────────────────────────────
const WP_CATEGORY_MAP: Record<number, CategoryId> = {
  4: "tahfidh", // تعليم وتحفيظ القرآن
  5: "lecture", // دروس ومحاضرات دينية
  6: "other", // أنشطة اجتماعية وخيرية
  7: "children", // أنشطة الأطفال والشباب
  8: "other", // الفعاليات الموسمية
};

// ──────────────────────────────────────────────
// Mapper: WPEvent → Activity
// ──────────────────────────────────────────────
/** Type guard: ACF is an object (REST API enabled) vs empty array (not enabled) */
function isACFObject(acf: WPEventACF | unknown[]): acf is WPEventACF {
  return acf !== null && !Array.isArray(acf) && typeof acf === "object";
}

// ──────────────────────────────────────────────
// Arabic day-of-week parser
// ──────────────────────────────────────────────
const ARABIC_DAY_MAP: Record<string, number> = {
  أحد: 0,
  اثنين: 1,
  ثلاثاء: 2,
  أربعاء: 3,
  خميس: 4,
  جمعة: 5,
  سبت: 6,
};

/** Parse Arabic day string like "كل يوم أحد" → 0 (Sunday) */
function parseArabicDayOfWeek(raw: unknown): number | undefined {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    // Try numeric first
    const num = parseInt(raw, 10);
    if (!isNaN(num)) return num;
    // Search for Arabic day name in the string
    for (const [name, value] of Object.entries(ARABIC_DAY_MAP)) {
      if (raw.includes(name)) return value;
    }
  }
  return undefined;
}

function mapWPEventToActivity(wpEvent: WPEvent): Activity {
  // Resolve featured image from _embedded
  const imageUrl =
    wpEvent._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? "";

  // Extract ACF fields if available (requires "Show in REST API" enabled in WP)
  const acf = isACFObject(wpEvent.acf) ? wpEvent.acf : undefined;

  // Log raw ACF data once to help debug field names
  if (acf) {
    console.log(`[ACF] Event #${wpEvent.id}:`, JSON.stringify(acf));
  }

  // ── Map Arabic ACF fields to Activity props ──

  // id & mosqueId: use mosque_id_temporary, fallback to WP event id
  const mosqueId = acf?.mosqueId;
  const id = mosqueId || wpEvent.id.toString();
  console.log(acf, "idws");

  // mosqueName & mosqueCity from Arabic keys
  const mosqueName = (acf?.["اسم_المسجد"] as string) || undefined;
  const mosqueCity = (acf?.["البلدية"] as string) || undefined;

  // title: WP title, fallback to النشاط
  const title = wpEvent.title.rendered || (acf?.["النشاط"] as string) || "";

  // description: prefer وصف, fallback to content.rendered
  const rawDescription =
    (acf?.["وصف"] as string) ||
    (acf?.description as string) ||
    wpEvent.content.rendered.replace(/<[^>]*>/g, "").trim();
  const description = typeof rawDescription === "string" ? rawDescription : "";

  // categoryId: use first item in تصنيفات array, then WP categories
  const acfCategories = acf?.["تصنيفات"] as number[] | undefined;
  const wpCategoryId =
    acfCategories?.[0] ?? wpEvent.events_and_activities_categories[0];
  const categoryId: CategoryId = WP_CATEGORY_MAP[wpCategoryId] ?? "lecture";

  // dayOfWeek: parse التاريخ_والوقت (e.g. "كل يوم أحد" → 0)
  const dayOfWeek =
    parseArabicDayOfWeek(acf?.["التاريخ_والوقت"]) ??
    parseArabicDayOfWeek(acf?.day_of_week);

  // type: default to recurring
  const rawType = acf?.event_type;
  const type: "recurring" | "one_off" =
    rawType === "one_off" ? "one_off" : "recurring";

  // instructor from الإمام
  const instructor =
    (acf?.["الإمام"] as string) || (acf?.instructor as string) || undefined;
  console.log("sdads", mosqueName + " " + mosqueCity);
  return {
    id,
    mosqueId: mosqueName + " " + mosqueCity,
    mosqueName,
    mosqueCity,
    title,
    description,
    categoryId,
    type,
    dayOfWeek,
    startTime: acf?.start_time ?? "",
    endTime: acf?.end_time ?? undefined,
    instructor,
    imageUrl,
  };
}

// ──────────────────────────────────────────────
// Fetch from WordPress REST API
// ──────────────────────────────────────────────
async function fetchEventsFromAPI(): Promise<Activity[]> {
  try {
    const response = await fetch(
      "https://www.masjidie.com/wp-json/wp/v2/events_activities?_embed&per_page=100",
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: WPEvent[] = await response.json();
    const events = data.map(mapWPEventToActivity);
    console.log(events, "data");
    return events;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    throw error;
  }
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

    // Prevent duplicate concurrent fetches
    if (isLoading) return;

    // Return cached data if still fresh
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
