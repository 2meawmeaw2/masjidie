import * as Location from "expo-location";
import { Linking, Platform } from "react-native";
import { Mosque } from "../constants/mockData";
import { getSavedLocation } from "./storage";

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Converts degrees to radians
 */
function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Calculates the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Number(d.toFixed(1)); // Return to 1 decimal place
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
