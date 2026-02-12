import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { getCurrentLocation } from "@/lib/location";
import * as Location from "expo-location";
import { searchLocation, SearchResult } from "@/lib/location-search";
import {
  saveLocation,
  getSavedLocation,
  clearSavedLocation,
  LocationData,
} from "@/lib/storage";

export default function ProfileScreen() {
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Search State
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedLocationData, setSavedLocationData] =
    useState<LocationData | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state with i18n language change
  useEffect(() => {
    const handleLanguageChanged = (lang: string) => {
      setCurrentLanguage(lang);
    };
    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  // Load saved location on mount
  useEffect(() => {
    loadSavedLocation();
  }, []);

  const loadSavedLocation = async () => {
    const data = await getSavedLocation();
    setSavedLocationData(data);
  };

  // Debounced Search Effect
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const searchResults = await searchLocation(query, currentLanguage);
      setResults(searchResults);
      setIsSearching(false);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, currentLanguage]);

  const handleLocationRefresh = async () => {
    setLoadingLocation(true);
    const loc = await getCurrentLocation();
    setCurrentLocation(loc);
    setLoadingLocation(false);
    if (loc) {
      const locationData: LocationData = {
        lat: loc.coords.latitude.toString(),
        lon: loc.coords.longitude.toString(),
        display_name: t("settings.currentLocation"),
        city: "Current Location",
      };
      await saveLocation(locationData);
      setSavedLocationData(locationData);
      Alert.alert(
        t("settings.locationUpdated"),
        `Lat: ${loc.coords.latitude.toFixed(4)}, Long: ${loc.coords.longitude.toFixed(4)}`,
      );
    } else {
      Alert.alert("Error", t("settings.locationError"));
    }
  };

  const handleSelectLocation = async (item: SearchResult) => {
    const locationData: LocationData = {
      lat: item.lat,
      lon: item.lon,
      display_name: item.display_name,
      city: item.address.city || item.address.town || item.address.village,
      country: item.address.country,
    };
    await saveLocation(locationData);
    setSavedLocationData(locationData);
    setQuery("");
    setResults([]);
    Alert.alert(t("settings.locationSaved"), item.display_name);
  };

  const handleClearLocation = async () => {
    await clearSavedLocation();
    setSavedLocationData(null);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const renderSettingItem = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    element: React.ReactNode,
    description?: string,
  ) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            {title}
          </Text>
          {description && (
            <Text
              style={[
                styles.settingDescription,
                { color: colors.textSecondary },
              ]}
            >
              {description}
            </Text>
          )}
        </View>
      </View>
      {element}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.header, { color: colors.text }]}>
        temp{t("settings.title")}
      </Text>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t("settings.appearance").toUpperCase()}
        </Text>
        {renderSettingItem(
          "moon",
          t("settings.darkMode"),
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: "#767577", true: colors.primary }}
            thumbColor={"#f4f3f4"}
          />,
          t("settings.darkModeDesc"),
        )}
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t("settings.language").toUpperCase()}
        </Text>
        <View
          style={[
            styles.languageContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {["en", "fr", "ar"].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageOption,
                currentLanguage === lang && { backgroundColor: colors.primary },
              ]}
              onPress={() => changeLanguage(lang)}
            >
              <Text
                style={[
                  styles.languageText,
                  {
                    color: currentLanguage === lang ? "#FFFFFF" : colors.text,
                  },
                ]}
              >
                {lang === "en"
                  ? "English"
                  : lang === "fr"
                    ? "Français"
                    : "العربية"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t("settings.location").toUpperCase()}
        </Text>

        {/* Saved Location Display */}
        {savedLocationData && (
          <View
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
              style={[
                styles.savedLocationText,
                { color: colors.textSecondary },
              ]}
            >
              {savedLocationData.display_name}
            </Text>
            <TouchableOpacity
              onPress={handleClearLocation}
              style={styles.clearLocationButton}
            >
              <Text style={{ color: colors.error, fontSize: 12 }}>
                {t("settings.clearLocation")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Current Location Button */}
        {renderSettingItem(
          "locate",
          t("settings.currentLocation"),
          <TouchableOpacity
            onPress={handleLocationRefresh}
            disabled={loadingLocation}
          >
            {loadingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="refresh" size={24} color={colors.text} />
            )}
          </TouchableOpacity>,
          currentLocation
            ? `${currentLocation.coords.latitude.toFixed(
                4,
              )}, ${currentLocation.coords.longitude.toFixed(4)}`
            : t("settings.refreshLocation"),
        )}

        {/* Search Input */}
        <View style={{ marginTop: 15 }}>
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={colors.textSecondary}
              style={{ marginRight: 10 }}
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
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.resultItem,
                    index === results.length - 1 && { borderBottomWidth: 0 },
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleSelectLocation(item)}
                >
                  <Text style={{ color: colors.text }}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {query.length > 2 && !isSearching && results.length === 0 && (
            <Text
              style={{
                color: colors.textSecondary,
                marginTop: 5,
                fontSize: 12,
                marginLeft: 5,
              }}
            >
              {t("settings.noResults")}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingTop: 60, paddingBottom: 400 },
  header: {
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  languageContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 5,
  },
  languageOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  languageText: {
    fontWeight: "600",
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  resultsContainer: {
    marginTop: 5,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  savedLocationContainer: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  savedLocationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  savedLocationTitle: {
    fontWeight: "600",
    marginLeft: 8,
  },
  savedLocationText: {
    fontSize: 14,
    marginBottom: 10,
  },
  clearLocationButton: {
    alignSelf: "flex-end",
  },
});
