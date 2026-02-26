import { supabase } from "@/lib/supabase";

let cachedCities: string[] | null = null;

export async function fetchMosqueCities(): Promise<string[]> {
  if (cachedCities) return cachedCities;

  const { data, error } = await supabase
    .from("mosques")
    .select("city")
    .order("city");

  if (error) {
    console.error("Failed to fetch mosque cities:", error.message);
    return [];
  }

  const unique = [...new Set((data as { city: string }[]).map((r) => r.city))];
  cachedCities = unique;
  return unique;
}

export function invalidateCitiesCache() {
  cachedCities = null;
}
