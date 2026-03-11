import AnimatedSettingRow from "@/components/settings/AnimatedSettingRow";
import ScreenHeader from "@/components/settings/Header";
import { BorderRadius, Colors, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import i18n from "@/lib/i18n";
import { fetchStateCoordinates, getCurrentLocation } from "@/lib/location";
import { searchLocation, SearchResult } from "@/lib/location-search";
import {
  clearSavedLocation,
  getSavedLocation,
  LocationData,
  saveLocation,
} from "@/lib/storage";
import { useAdhanStore } from "@/lib/stores/adhanStore";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

export default function LocationScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { recalculateAndSchedule } = useAdhanStore();

  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedLocationData, setSavedLocationData] =
    useState<LocationData | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSavedLocation();
  }, []);

  // Debounced Search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const searchResults = await searchLocation(query, i18n.language);
      setResults(searchResults);
      setIsSearching(false);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const loadSavedLocation = async () => {
    const data = await getSavedLocation();
    setSavedLocationData(data);
  };

  const handleLocationRefresh = async () => {
    setLoadingLocation(true);
    const loc = await getCurrentLocation();
    setCurrentLocation(loc);

    if (loc) {
      const { latitude, longitude } = loc.coords;
      let locationData: LocationData = {
        lat: latitude.toString(),
        lon: longitude.toString(),
        display_name: t("settings.currentLocation"),
        city: "Current Location",
      };

      try {
        // Reverse geocode to get the state
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
          { headers: { "User-Agent": "MasjidieApp/1.0" } },
        );
        const geo = await res.json();

        locationData = {
          ...locationData,
          city:
            geo.address?.city ||
            geo.address?.town ||
            geo.address?.village ||
            "Current Location",
          town: geo.address?.town,
          village: geo.address?.village,
          state: geo.address?.state,
          country: geo.address?.country,
          display_name: geo.display_name || t("settings.currentLocation"),
        };

        // Forward geocode the state for prayer coordinates
        if (locationData.state) {
          const stateCoords = await fetchStateCoordinates(locationData.state);
          if (stateCoords) {
            locationData.stateLat = stateCoords.lat;
            locationData.stateLon = stateCoords.lon;
          }
        }
      } catch (e) {
        console.warn("Reverse geocoding failed, using basic GPS coords", e);
      }

      await saveLocation(locationData);
      setSavedLocationData(locationData);
      recalculateAndSchedule();
      Alert.alert(
        t("settings.locationUpdated"),
        `Lat: ${loc.coords.latitude.toFixed(4)}, Long: ${loc.coords.longitude.toFixed(4)}`,
      );
    } else {
      Alert.alert("Error", t("settings.locationError"));
    }
    setLoadingLocation(false);
  };

  const handleSelectLocation = async (item: SearchResult) => {
    const locationData: LocationData = {
      lat: item.lat,
      lon: item.lon,
      display_name: item.display_name,
      city: item.address.city || item.address.town || item.address.village,
      country: item.address.country,
      state: item.address.state,
    };

    if (locationData.state) {
      const stateCoords = await fetchStateCoordinates(locationData.state);
      if (stateCoords) {
        locationData.stateLat = stateCoords.lat;
        locationData.stateLon = stateCoords.lon;
      }
    }

    await saveLocation(locationData);
    setSavedLocationData(locationData);
    setQuery("");
    setResults([]);
    recalculateAndSchedule();
    Alert.alert(t("settings.locationSaved"), item.display_name);
  };

  const handleClearLocation = async () => {
    await clearSavedLocation();
    setSavedLocationData(null);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="الموقع" />

      {/* Saved Location Display */}
      {savedLocationData && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[
            styles.savedLocationContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.savedLocationHeader}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={[styles.savedLocationTitle, { color: colors.text }]}>
              {t("settings.savedLocation")}
            </Text>
          </View>
          <Text
            style={[styles.savedLocationText, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {savedLocationData.display_name}
          </Text>
          <TouchableOpacity
            onPress={handleClearLocation}
            style={styles.clearLocationButton}
          >
            <Text style={[styles.clearLocationText, { color: colors.error }]}>
              {t("settings.clearLocation")}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* GPS Refresh */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t("settings.currentLocation").toUpperCase()}
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <AnimatedSettingRow
            icon="locate"
            title={t("settings.currentLocation")}
            description={
              currentLocation
                ? `${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`
                : t("settings.refreshLocation")
            }
            index={0}
            isLast
            rightElement={
              <TouchableOpacity
                onPress={handleLocationRefresh}
                disabled={loadingLocation}
              >
                {loadingLocation ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="refresh" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            }
          />
        </View>
      </View>

      {/* Search */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t("settings.searchPlaceholder").toUpperCase()}
        </Text>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={colors.textSecondary}
            style={{ marginRight: Spacing.sm }}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t("settings.searchPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
        </View>

        {/* Search Results */}
        {results.length > 0 && (
          <View
            style={[
              styles.resultsContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {results.map((item, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 60)
                  .springify()
                  .damping(14)}
              >
                <TouchableOpacity
                  style={[
                    styles.resultItem,
                    index === results.length - 1 && { borderBottomWidth: 0 },
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleSelectLocation(item)}
                >
                  <Text style={[styles.resultText, { color: colors.text }]}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
        {query.length > 2 && !isSearching && results.length === 0 && (
          <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
            {t("settings.noResults")}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: Fonts.mdsans,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    paddingHorizontal: Spacing.xs,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    overflow: "hidden",
  },
  savedLocationContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  savedLocationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  savedLocationTitle: {
    fontFamily: Fonts.mdsans,
    fontSize: 15,
    marginLeft: Spacing.sm,
  },
  savedLocationText: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  clearLocationButton: {
    alignSelf: "flex-end",
  },
  clearLocationText: {
    fontSize: 12,
    fontFamily: Fonts.mdsans,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.rsans,
  },
  resultsContainer: {
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  resultItem: {
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultText: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
  },
  noResultsText: {
    marginTop: Spacing.xs,
    fontSize: 12,
    fontFamily: Fonts.rsans,
    paddingHorizontal: Spacing.xs,
  },
});
