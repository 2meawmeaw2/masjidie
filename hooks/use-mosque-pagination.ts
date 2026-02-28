import { Mosque } from "@/constants/mockData";
import {
  calculateDistance,
  extractCoordsFromUrl,
  getPreferredLocation,
  resolveGoogleMapsLink,
} from "@/lib/location";
import { supabase } from "@/lib/supabase";
import { SupabaseMosque, mapSupabaseMosqueToMosque } from "@/lib/types/mosque";
import { useCallback, useEffect, useRef, useState } from "react";

type DistanceRange = "any" | "near" | "medium" | "far";
type SortOption = "distance" | "name";

const PAGE_SIZE = 20;

const DISTANCE_MAX: Record<DistanceRange, number> = {
  any: Infinity,
  near: 2,
  medium: 10,
  far: 25,
};

interface Params {
  searchQuery: string;
  selectedCities: string[];
  selectedDistance: DistanceRange;
  sortBy: SortOption;
}

interface Result {
  mosques: Mosque[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  loadMore: () => void;
  refresh: () => void;
}

export function useMosquePagination({
  searchQuery,
  selectedCities,
  selectedDistance,
  sortBy,
}: Params): Result {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const pageRef = useRef(0);
  const fetchIdRef = useRef(0);
  const userLocationRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Resolve user location once
  useEffect(() => {
    getPreferredLocation().then((loc) => {
      userLocationRef.current = loc;
    });
  }, []);

  const resolveCoordinates = useCallback(
    async (items: Mosque[]): Promise<Mosque[]> => {
      const results = await Promise.all(
        items.map(async (mosque) => {
          if (
            mosque.latitude === 0 &&
            mosque.longitude === 0 &&
            mosque.mapsUrl
          ) {
            try {
              let finalUrl = mosque.mapsUrl;
              if (
                mosque.mapsUrl.includes("goo.gl") ||
                mosque.mapsUrl.includes("app.goo.gl") ||
                mosque.mapsUrl.includes("share.google")
              ) {
                finalUrl = await resolveGoogleMapsLink(mosque.mapsUrl);
              }
              const coords = extractCoordsFromUrl(finalUrl);
              if (coords) {
                return { ...mosque, ...coords };
              }
            } catch (err) {
              console.warn(
                `Failed to resolve coords for mosque ${mosque.name}`,
                err,
              );
            }
          }
          return mosque;
        }),
      );
      return results;
    },
    [],
  );

  const addDistances = useCallback((items: Mosque[]): Mosque[] => {
    const loc = userLocationRef.current;
    if (!loc) return items;
    return items.map((m) => ({
      ...m,
      distance: calculateDistance(
        loc.latitude,
        loc.longitude,
        m.latitude,
        m.longitude,
      ),
    }));
  }, []);

  const buildQuery = useCallback(() => {
    let query = supabase.from("mosques").select("*", { count: "exact" });

    if (searchQuery.trim()) {
      const term = `%${searchQuery.trim()}%`;
      query = query.or(
        `name.ilike.${term},address.ilike.${term},city.ilike.${term}`,
      );
    }

    if (selectedCities.length > 0) {
      query = query.in("city", selectedCities);
    }

    // Sort server-side by name when sortBy is "name"
    // For distance sort, we sort client-side after computing distances
    if (sortBy === "name") {
      query = query.order("name");
    } else {
      query = query.order("name"); // stable fallback; client re-sorts by distance
    }

    return query;
  }, [searchQuery, selectedCities, sortBy]);

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      const currentFetchId = ++fetchIdRef.current;

      if (page === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const useDistanceFilter = selectedDistance !== "any";

        let query = buildQuery();

        if (!useDistanceFilter) {
          // True server pagination
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;
          query = query.range(from, to);
        }
        // When distance filter is active, we fetch ALL matching rows
        // and filter distance client-side (no PostGIS)

        const { data, error, count } = await query;

        // Discard stale responses
        if (fetchIdRef.current !== currentFetchId) return;

        if (error) {
          console.error("Mosque pagination error:", error.message);
          setIsLoading(false);
          setIsLoadingMore(false);
          return;
        }

        let mapped = (data as SupabaseMosque[]).map(mapSupabaseMosqueToMosque);
        mapped = await resolveCoordinates(mapped);
        mapped = addDistances(mapped);

        if (useDistanceFilter) {
          const maxDist = DISTANCE_MAX[selectedDistance];
          mapped = mapped.filter((m) => m.distance <= maxDist);
        }

        // Sort by distance client-side when needed
        if (sortBy === "distance") {
          mapped.sort((a, b) => a.distance - b.distance);
        }

        if (useDistanceFilter) {
          // All results already fetched and filtered
          setMosques(mapped);
          setTotalCount(mapped.length);
          setHasMore(false);
        } else {
          const serverTotal = count ?? 0;
          setTotalCount(serverTotal);

          if (append) {
            setMosques((prev) => [...prev, ...mapped]);
          } else {
            setMosques(mapped);
          }

          setHasMore(
            (page + 1) * PAGE_SIZE < serverTotal && mapped.length === PAGE_SIZE,
          );
        }
      } catch (err) {
        if (fetchIdRef.current !== currentFetchId) return;
        console.error("Mosque pagination exception:", err);
      } finally {
        if (fetchIdRef.current === currentFetchId) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [buildQuery, selectedDistance, sortBy, resolveCoordinates, addDistances],
  );

  // Reset and fetch page 0 when filters change
  useEffect(() => {
    pageRef.current = 0;
    fetchPage(0, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || isLoading || !hasMore) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    fetchPage(nextPage, true);
  }, [isLoadingMore, isLoading, hasMore, fetchPage]);

  const refresh = useCallback(() => {
    pageRef.current = 0;
    fetchPage(0, false);
  }, [fetchPage]);

  return {
    mosques,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    loadMore,
    refresh,
  };
}
