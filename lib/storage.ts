import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LocationData {
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
  lat: string;
  lon: string;
  display_name: string;
  /** State/wilaya center latitude — used for prayer time calculations */
  stateLat?: string;
  /** State/wilaya center longitude — used for prayer time calculations */
  stateLon?: string;
}

const LOCATION_STORAGE_KEY = "@user_location";

// Default: Algiers coordinates
const DEFAULT_LAT = 36.75;
const DEFAULT_LON = 3.06;

export const saveLocation = async (location: LocationData): Promise<void> => {
  try {
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch (error) {
    console.error("Error saving location:", error);
    throw error;
  }
};

export const getSavedLocation = async (): Promise<LocationData | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error("Error reading location:", error);
    return null;
  }
};

/**
 * Returns coordinates for prayer time calculations.
 * Prioritises state-level coords (stateLat/stateLon) over precise GPS coords.
 */
export const getStateCoordsForPrayer = async (): Promise<{
  lat: number;
  lon: number;
}> => {
  const saved = await getSavedLocation();
  if (saved) {
    // Prefer state-level coordinates
    if (saved.stateLat && saved.stateLon) {
      const lat = parseFloat(saved.stateLat);
      const lon = parseFloat(saved.stateLon);
      if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
    }
    // Fallback to precise coordinates
    const lat = parseFloat(saved.lat);
    const lon = parseFloat(saved.lon);
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
  }
  return { lat: DEFAULT_LAT, lon: DEFAULT_LON };
};

export const clearSavedLocation = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing location:", error);
  }
};
