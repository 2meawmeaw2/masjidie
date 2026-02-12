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
}

const LOCATION_STORAGE_KEY = "@user_location";

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

export const clearSavedLocation = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing location:", error);
  }
};
