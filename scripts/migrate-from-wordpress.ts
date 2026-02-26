/**
 * WordPress → Supabase Migration Script
 *
 * Fetches all posts from the live WordPress REST API, transforms them using
 * the same mapping logic that was in the old store files, then upserts every
 * row into the corresponding Supabase table.
 *
 * Usage:
 *   npx tsx scripts/migrate-from-wordpress.ts
 *
 * By default the anon key is used, but it can only INSERT if your RLS
 * policies allow it.  For a one-time migration you should supply the
 * service-role key so that RLS is bypassed:
 *
 *   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaGthb2ZpaGNoaGl6aXF1a3Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQzMjU1OSwiZXhwIjoyMDg3MDA4NTU5fQ.kEwYzHdwUb0_UwpQ5ChlUbaVKrLWhpDXXcw1COyH0yQ=<key> npx tsx scripts/migrate-from-wordpress.ts
 */

import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// Supabase client  (no AsyncStorage — this runs in Node.js)
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://zghkaofihchhiziqukvw.supabase.co";
// Service-role key — bypasses RLS, safe for this one-time migration script
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaGthb2ZpaGNoaGl6aXF1a3Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQzMjU1OSwiZXhwIjoyMDg3MDA4NTU5fQ.kEwYzHdwUb0_UwpQ5ChlUbaVKrLWhpDXXcw1COyH0yQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// WordPress types
// ─────────────────────────────────────────────────────────────────────────────

interface WPMosqueACF {
  name?: string;
  state_?: string;
  commune?: string;
  url?: string;
  description?: string;
  capacity?: string;
  imam?: string;
  services?: string;
  longitude?: string;
  latitude?: string;
  picurl?: number | string;
  [key: string]: unknown;
}

interface WPMosque {
  id: number;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  acf: WPMosqueACF | unknown[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string }>;
  };
}

interface WPEventACF {
  mosqueId?: string;
  instructor?: string;
  start_time?: string;
  end_time?: string;
  event_type?: string;
  description?: string;
  [key: string]: unknown;
}

interface WPEvent {
  id: number;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  events_and_activities_categories: number[];
  acf: WPEventACF | unknown[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string }>;
  };
}

interface WPQuranSchool {
  id: number;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  acf: Record<string, unknown> | unknown[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      media_details?: {
        sizes?: Record<string, { source_url: string }>;
      };
    }>;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function isACFObject<T>(acf: T | unknown[]): acf is T {
  return acf !== null && !Array.isArray(acf) && typeof acf === "object";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function extractCoordsFromUrl(
  url: string,
): { latitude: number; longitude: number } | null {
  try {
    // Standard Google Maps share link: /@lat,lng/
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
      };
    }
    // Query-param style: ?q=lat,lng or &ll=lat,lng
    const qMatch = url.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      return {
        latitude: parseFloat(qMatch[1]),
        longitude: parseFloat(qMatch[2]),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Events helpers
// ─────────────────────────────────────────────────────────────────────────────

const WP_CATEGORY_MAP: Record<number, string> = {
  4: "tahfidh", // تعليم وتحفيظ القرآن
  5: "lecture", // دروس ومحاضرات دينية
  6: "lecture", // أنشطة اجتماعية وخيرية  (no "other" category in app)
  7: "children", // أنشطة الأطفال والشباب
  8: "lecture", // الفعاليات الموسمية
};

const ARABIC_DAY_MAP: Record<string, number> = {
  أحد: 0,
  اثنين: 1,
  ثلاثاء: 2,
  أربعاء: 3,
  خميس: 4,
  جمعة: 5,
  سبت: 6,
};

function parseArabicDayOfWeek(raw: unknown): number | undefined {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const num = parseInt(raw, 10);
    if (!isNaN(num)) return num;
    for (const [name, value] of Object.entries(ARABIC_DAY_MAP)) {
      if (raw.includes(name)) return value;
    }
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mappers: WordPress post → Supabase row
// ─────────────────────────────────────────────────────────────────────────────

function mapWPMosque(wp: WPMosque): Record<string, unknown> {
  const acf = isACFObject<WPMosqueACF>(wp.acf) ? wp.acf : undefined;

  const picUrl = typeof acf?.picurl === "string" ? acf.picurl : "";
  const featuredImage =
    wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? "";
  const imageUrl = picUrl || featuredImage || "";

  const mapsUrl = acf?.url ?? "";
  let latitude = 0;
  let longitude = 0;

  const urlCoords = extractCoordsFromUrl(mapsUrl);
  if (urlCoords) {
    latitude = urlCoords.latitude;
    longitude = urlCoords.longitude;
  } else {
    latitude =
      typeof acf?.latitude === "string" ? parseFloat(acf.latitude) || 0 : 0;
    longitude =
      typeof acf?.longitude === "string" ? parseFloat(acf.longitude) || 0 : 0;
  }

  const name = acf?.name || wp.title.rendered;
  const commune = acf?.commune ?? "";
  // Build a human-readable ID that matches the mosque_id used in events
  const id = name && commune ? `${name} ${commune}` : String(wp.id);

  return {
    id,
    name,
    address: commune,
    city: acf?.state_ ?? "",
    image_url: imageUrl || null,
    maps_url: mapsUrl || null,
    latitude,
    longitude,
    description:
      (acf?.description as string) || stripHtml(wp.content.rendered) || null,
    imam: (acf?.imam as string) || null,
    capacity: (acf?.capacity as string) || null,
    services: (acf?.services as string) || null,
  };
}

function mapWPEvent(wp: WPEvent): Record<string, unknown> {
  const acf = isACFObject<WPEventACF>(wp.acf) ? wp.acf : undefined;

  const imageUrl = wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? "";

  const mosqueName = (acf?.["اسم_المسجد"] as string) || null;
  const mosqueCity = (acf?.["البلدية"] as string) || null;
  const mosqueId =
    mosqueName && mosqueCity ? `${mosqueName} ${mosqueCity}` : null;

  // Use acf.mosqueId if present (legacy field), otherwise the WP post ID
  const id = (acf?.mosqueId as string) || String(wp.id);

  const description =
    (acf?.["وصف"] as string) ||
    (acf?.description as string) ||
    stripHtml(wp.content.rendered) ||
    null;

  const acfCategories = acf?.["تصنيفات"] as number[] | undefined;
  const wpCategoryId =
    acfCategories?.[0] ?? wp.events_and_activities_categories?.[0];
  const categoryId = WP_CATEGORY_MAP[wpCategoryId] ?? "lecture";

  const dayOfWeek =
    parseArabicDayOfWeek(acf?.["التاريخ_والوقت"]) ??
    parseArabicDayOfWeek(acf?.day_of_week);

  const type =
    (acf?.event_type as string) === "one_off" ? "one_off" : "recurring";

  const instructor =
    (acf?.["الإمام"] as string) || (acf?.instructor as string) || null;

  return {
    id,
    mosque_id: mosqueId,
    mosque_name: mosqueName,
    mosque_city: mosqueCity,
    title: wp.title.rendered,
    description,
    category_id: categoryId,
    type,
    date: null,
    start_time: (acf?.start_time as string) || null,
    end_time: (acf?.end_time as string) || null,
    day_of_week: dayOfWeek !== undefined ? dayOfWeek : null,
    instructor,
    image_url: imageUrl || null,
  };
}

function mapWPSchool(wp: WPQuranSchool): Record<string, unknown> {
  const media = wp._embedded?.["wp:featuredmedia"]?.[0];
  const imageUrl =
    media?.media_details?.sizes?.["large"]?.source_url ??
    media?.source_url ??
    "";

  const description = stripHtml(wp.content.rendered);
  const acf = Array.isArray(wp.acf) ? {} : (wp.acf ?? {});

  return {
    id: String(wp.id),
    name: wp.title.rendered,
    description: description || null,
    city: (acf["city"] as string) || null,
    address: (acf["address"] as string) || null,
    image_url: imageUrl || null,
    phone: (acf["phone"] as string) || null,
    email: (acf["email"] as string) || null,
    website: (acf["website"] as string) || null,
    founded: (acf["founded"] as string) || null,
    student_count: (acf["student_count"] as number) || null,
    programs: Array.isArray(acf["programs"]) ? acf["programs"] : [],
    age_range: (acf["age_range"] as string) || null,
    gender: (acf["gender"] as string) || "mixed",
    latitude: (acf["latitude"] as number) || null,
    longitude: (acf["longitude"] as number) || null,
    maps_url: (acf["maps_url"] as string) || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Paginated WordPress fetch
// ─────────────────────────────────────────────────────────────────────────────

async function fetchAllWPPages<T>(baseUrl: string): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = `${baseUrl}&page=${page}`;
    console.log(`    page ${page}/${totalPages} → ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${url}`);
    }

    const header = response.headers.get("X-WP-TotalPages");
    if (header) totalPages = parseInt(header, 10);

    const data = (await response.json()) as T[];
    results.push(...data);
    page++;
  } while (page <= totalPages);

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase upsert (batched)
// ─────────────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 50;

async function upsertRows(
  table: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  if (rows.length === 0) {
    console.log(`  (no rows for ${table})`);
    return;
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: "id" });

    if (error) {
      throw new Error(`Supabase upsert error on "${table}": ${error.message}`);
    }
  }

  console.log(`  ✓ ${rows.length} rows upserted into "${table}"`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=== WordPress → Supabase Migration ===\n");

  // 1. Mosques
  console.log("→ Fetching mosques from WordPress...");
  const wpMosques = await fetchAllWPPages<WPMosque>(
    "https://www.masjidie.com/wp-json/wp/v2/mosques?_embed&per_page=100",
  );
  console.log(`  Fetched ${wpMosques.length} mosque(s)`);
  const mosqueRows = wpMosques.map(mapWPMosque);
  await upsertRows("mosques", mosqueRows);

  // Collect the IDs that are now in Supabase so events can safely reference them
  const validMosqueIds = new Set(mosqueRows.map((r) => r["id"] as string));

  // 2. Events / Activities
  console.log("\n→ Fetching events_activities from WordPress...");
  const wpEvents = await fetchAllWPPages<WPEvent>(
    "https://www.masjidie.com/wp-json/wp/v2/events_activities?_embed&per_page=100",
  );
  console.log(`  Fetched ${wpEvents.length} event(s)`);
  // Null out mosque_id when the referenced mosque wasn't inserted (FK safety)
  const eventRows = wpEvents.map((wp) => {
    const row = mapWPEvent(wp);
    if (row["mosque_id"] && !validMosqueIds.has(row["mosque_id"] as string)) {
      console.log(
        `    ⚠ event "${row["title"]}" references unknown mosque_id "${row["mosque_id"]}" — setting to null`,
      );
      row["mosque_id"] = null;
    }
    return row;
  });
  await upsertRows("events_activities", eventRows);

  // 3. Quran Schools
  console.log("\n→ Fetching quran_schools from WordPress...");
  const wpSchools = await fetchAllWPPages<WPQuranSchool>(
    "https://www.masjidie.com/wp-json/wp/v2/quran_schools?_embed&per_page=100",
  );
  console.log(`  Fetched ${wpSchools.length} school(s)`);
  const schoolRows = wpSchools.map(mapWPSchool);
  await upsertRows("quran_schools", schoolRows);

  console.log("\n✓ Migration complete!");
}

main().catch((err: unknown) => {
  console.error("\n✗ Migration failed:", err);
  process.exit(1);
});
