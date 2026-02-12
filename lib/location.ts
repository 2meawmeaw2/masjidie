import { Linking, Platform } from "react-native";
import { Mosque } from "../constants/mockData";
import * as Location from "expo-location";
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
