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
} from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
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
import { useAuthStore } from "@/lib/stores/authStore";
import {
  useAdhanStore,
  PrayerName,
  MethodKey,
} from "@/lib/stores/adhanStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Adhan Store
  const {
    todayTimes,
    preferences: adhanPrefs,
    togglePrayer,
    setCalculationMethod,
    recalculateAndSchedule,
  } = useAdhanStore();

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
      recalculateAndSchedule();
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
    recalculateAndSchedule();
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
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + Spacing.md },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.header, { color: colors.text }]}>
        {t("settings.title")}
      </Text>

      {/* Appearance & Language Section — grouped together */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t("settings.appearance").toUpperCase()}
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
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
                currentLanguage === lang && {
                  backgroundColor: colors.primary,
                  borderRadius: BorderRadius.md,
                  margin: 3,
                },
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

      {/* Adhan Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t("adhan.title").toUpperCase()}
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {(["fajr", "dhuhr", "asr", "maghrib", "isha"] as PrayerName[]).map(
            (prayer) => {
              const timeEntry = todayTimes.find((t) => t.name === prayer);
              const timeStr = timeEntry
                ? timeEntry.time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--";
              return renderSettingItem(
                prayer === "fajr"
                  ? "sunny"
                  : prayer === "maghrib"
                    ? "moon"
                    : "time",
                t(`adhan.${prayer}`),
                <Switch
                  value={adhanPrefs.enabledPrayers[prayer]}
                  onValueChange={() => togglePrayer(prayer)}
                  trackColor={{ false: "#767577", true: colors.primary }}
                  thumbColor="#f4f3f4"
                />,
                timeStr,
              );
            },
          )}
          {renderSettingItem(
            "calculator",
            t("adhan.calculationMethod"),
            <TouchableOpacity
              onPress={() => {
                const methods: { key: MethodKey; label: string }[] = [
                  { key: "algerian", label: t("adhan.algerian") },
                  { key: "muslimWorldLeague", label: t("adhan.muslimWorldLeague") },
                  { key: "egyptian", label: t("adhan.egyptian") },
                  { key: "ummAlQura", label: t("adhan.ummAlQura") },
                  { key: "northAmerica", label: t("adhan.northAmerica") },
                  { key: "karachi", label: t("adhan.karachi") },
                ];
                Alert.alert(
                  t("adhan.calculationMethod"),
                  undefined,
                  methods.map((m) => ({
                    text:
                      m.key === adhanPrefs.calculationMethod
                        ? `✓ ${m.label}`
                        : m.label,
                    onPress: () => setCalculationMethod(m.key),
                  })),
                );
              }}
            >
              <Text style={[styles.methodText, { color: colors.primary }]}>
                {t(`adhan.${adhanPrefs.calculationMethod}`)}
              </Text>
            </TouchableOpacity>,
          )}
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
          </View>
        )}

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
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
                <Ionicons name="refresh" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>,
            currentLocation
              ? `${currentLocation.coords.latitude.toFixed(
                  4,
                )}, ${currentLocation.coords.longitude.toFixed(4)}`
              : t("settings.refreshLocation"),
          )}
        </View>

        {/* Search Input */}
        <View style={{ marginTop: Spacing.md }}>
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
                <TouchableOpacity
                  key={index}
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
              ))}
            </View>
          )}
          {query.length > 2 && !isSearching && results.length === 0 && (
            <Text
              style={[styles.noResultsText, { color: colors.textSecondary }]}
            >
              {t("settings.noResults")}
            </Text>
          )}
        </View>
      </View>

      {/* Admin Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          ADMIN
        </Text>
        <TouchableOpacity
          style={[
            styles.adminButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() =>
            session ? router.push("/admin") : router.push("/auth/login")
          }
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
            <Ionicons
              name={session ? "shield-checkmark" : "shield-outline"}
              size={22}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.settingTitle, { color: colors.text, flex: 1 }]}>
            {session ? "Admin Dashboard" : "Admin Login"}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {!session && (
          <TouchableOpacity
            style={[
              styles.adminButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                marginTop: Spacing.sm,
              },
            ]}
            onPress={() => router.push("/auth/register")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.settingTitle, { color: colors.text, flex: 1 }]}>
              Register Your Mosque/School
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
  },
  header: {
    fontSize: 28,
    fontFamily: Fonts.bdsans,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
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
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md - 2,
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
    borderRadius: BorderRadius.sm + 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm + 4,
  },
  settingTitle: {
    fontSize: 15,
    fontFamily: Fonts.mdsans,
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
    marginTop: 2,
  },
  methodText: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },
  languageContainer: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    padding: 3,
  },
  languageOption: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  languageText: {
    fontFamily: Fonts.mdsans,
    fontSize: 14,
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
  savedLocationContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
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
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm + 4,
  },
});
