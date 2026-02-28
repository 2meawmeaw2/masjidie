import * as Location from "expo-location";
import { Linking, Platform } from "react-native";
import { Mosque } from "../constants/mockData";
import { getSavedLocation } from "./storage";

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Calculates driving distance using OSRM by extracting destination
 * coordinates from a Google Maps URL.
 * @returns Distance in km as a string (e.g. "3.2"), or null on failure
 */
export async function calculateDistance(
  googleMapsUrl: string,
  userlat: string | number | undefined,
  userlon: string | number | undefined,
) {
  try {
    // 1. Safety Check: Do we even have user coords?
    if (!userlat || !userlon) {
      throw new Error("User coordinates are missing. Wait for GPS to lock.");
    }

    const decodedUrl = decodeURIComponent(googleMapsUrl);
    let destLat, destLng;

    // Regex patterns
    const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const regexQuery = /query=(-?\d+\.\d+),(-?\d+\.\d+)/;

    const matchAt = decodedUrl.match(regexAt);
    const matchQuery = decodedUrl.match(regexQuery);

    if (matchAt) {
      destLat = matchAt[1];
      destLng = matchAt[2];
    } else if (matchQuery) {
      destLat = matchQuery[1];
      destLng = matchQuery[2];
    } else {
      throw new Error("Could not find coordinates in Google Maps URL.");
    }

    // 2. Construct URL - OSRM MUST have [Longitude],[Latitude]
    // Trim values to remove any accidental whitespace
    const origin = `${String(userlon).trim()},${String(userlat).trim()}`;
    const destination = `${String(destLng).trim()},${String(destLat).trim()}`;

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin};${destination}?overview=false`;

    // 3. Fetch with Headers (React Native sometimes needs these)

    const response = await fetch(osrmUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.code !== "Ok") {
      throw new Error(`OSRM Error: ${data.code}`);
    }

    if (data.code === "Ok" && data.routes.length > 0) {
      const route = data.routes[0];

      // Convert meters to kilometers
      const distanceKm = (route.distance / 1000).toFixed(1);

      // Convert seconds to minutes

      return distanceKm;
    } else {
      throw new Error(`OSRM Error: ${data.code}`);
    }
  } catch (error: any) {
    console.error("Distance Calculation Error:", error.message);
    return null;
  }
}
/**
 * Fast local distance calculation using the Haversine formula.
 * Returns distance in km. Use this for list views / sorting instead
 * of the OSRM-based `calculateDistance` which makes a network call per mosque.
 */
export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = (R * c).toFixed(1);
  return parseFloat(distance);
}

/**
 * Requests permissions and gets current user location
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission to access location was denied");
      return null;
    }

    let location = await Location.getCurrentPositionAsync({});
    return location;
  } catch (error) {
    console.error("Error getting location:", error);
    return null;
  }
}

/**
 * Gets the preferred location: either saved in storage or current GPS
 */
export async function getPreferredLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    // 1. Check saved location
    const saved = await getSavedLocation();
    if (saved && saved.lat && saved.lon) {
      return {
        latitude: parseFloat(saved.lat),
        longitude: parseFloat(saved.lon),
      };
    }

    // 2. Fallback to GPS
    const current = await getCurrentLocation();
    if (current) {
      return {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting preferred location:", error);
    return null;
  }
}

// ──────────────────────────────────────────────
// Google Maps URL coordinate extraction
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(shortUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.url && response.url !== shortUrl) {
      return response.url;
    }

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

export const handleOpenMaps = async (mosque: Mosque) => {
  // Open the unique Google Maps link for the mosque directly.
  // This uses Universal Links (Android) or standard URL handling (iOS) to open the Maps app if installed.
  try {
    if (mosque.mapsUrl) {
      await Linking.openURL(mosque.mapsUrl);
    } else {
      // Fallback: search by address if no specific map link is found
      const destination = encodeURIComponent(mosque.address);
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${destination}`,
        android: `https://www.google.com/maps/search/?api=1&query=${destination}`,
      });
      if (url) await Linking.openURL(url);
    }
  } catch (error) {
    console.error("Error opening map:", error);
  }
};
