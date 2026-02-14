import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import {
  Colors,
  Spacing,
  Fonts,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { useTranslation } from "react-i18next";
import { ACTIVITIES } from "@/constants/mockData";
import { useMosquesStore } from "@/lib/stores/mosquesStore";
import { CATEGORIES } from "@/constants/categories";
import { MosqueCard } from "@/components/MosqueCard";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { calculateDistance, getPreferredLocation } from "@/lib/location";

export default function ExploreScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const {
    mosques,
    isLoading: mosquesLoading,
    fetchMosques,
  } = useMosquesStore();

  const [mosquesWithDistance, setMosquesWithDistance] = useState(mosques);

  React.useEffect(() => {
    fetchMosques();
  }, []);

  // Calculate distances
  React.useEffect(() => {
    (async () => {
      // 1. Get user location
      const location = await getPreferredLocation();

      // 2. Calculate distance for each mosque
      if (location && mosques.length > 0) {
        console.log("[Explore] User Location:", location);
        const updatedMosques = mosques.map((mosque) => {
          const dist = calculateDistance(
            location.latitude,
            location.longitude,
            mosque.latitude,
            mosque.longitude,
          );
          console.log(
            `[Explore] ${mosque.name} (${mosque.latitude}, ${mosque.longitude}) -> ${dist} km`,
          );
          return { ...mosque, distance: dist };
        });
        setMosquesWithDistance(updatedMosques);
      } else {
        // Fallback if no location or empty mosques
        setMosquesWithDistance(mosques);
      }
    })();
  }, [mosques]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Extract unique cities (Wilayas)
  const cities = useMemo(() => {
    const allCities = mosquesWithDistance.map((m) => m.city);
    // Remove duplicates
    const uniqueCities = Array.from(new Set(allCities));
    return ["الكل", ...uniqueCities];
  }, [mosquesWithDistance]);

  // Extract categories
  const categories = useMemo(() => {
    return ["الكل", ...Object.keys(CATEGORIES)];
  }, []);

  // Filter Logic
  const filteredMosques = useMemo(() => {
    return mosquesWithDistance.filter((mosque) => {
      const matchesSearch =
        mosque.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mosque.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity =
        selectedCities.length === 0 || selectedCities.includes(mosque.city);

      // Check if mosque has activities in ANY of the selected categories
      const matchesCategory =
        selectedCategories.length === 0 ||
        ACTIVITIES.some(
          (activity) =>
            activity.mosqueId === mosque.id &&
            selectedCategories.includes(activity.categoryId),
        );

      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [searchQuery, selectedCities, selectedCategories]);

  const toggleCity = useCallback((city: string) => {
    // Haptic feedback for selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (city === "الكل") {
      setSelectedCities([]);
      return;
    }

    setSelectedCities((prev) => {
      // Safety check: ensure prev is an array (HMR might keep old string state)
      const safePrev = Array.isArray(prev) ? prev : [];

      const isSelected = safePrev.includes(city);
      if (isSelected) {
        return safePrev.filter((c) => c !== city);
      } else {
        return [...safePrev, city];
      }
    });
  }, []);

  const toggleCategory = useCallback((category: string) => {
    // Haptic feedback for selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (category === "الكل") {
      setSelectedCategories([]);
      return;
    }

    setSelectedCategories((prev) => {
      // Safety check: ensure prev is an array (HMR might keep old string state)
      const safePrev = Array.isArray(prev) ? prev : [];

      const isSelected = safePrev.includes(category);
      if (isSelected) {
        return safePrev.filter((c) => c !== category);
      } else {
        return [...safePrev, category];
      }
    });
  }, []);

  const renderCityFilterItem = (city: string, index: number) => {
    // "All" is selected if the array is empty
    const isSelected =
      city === "الكل"
        ? selectedCities.length === 0
        : selectedCities.includes(city);

    return (
      <TouchableOpacity
        key={city}
        onPress={() => toggleCity(city)}
        style={[
          styles.filterChip,
          {
            backgroundColor: isSelected ? theme.primary : theme.card,
            borderColor: isSelected ? theme.primary : theme.border,
            flexDirection: "row", // Ensure text and icon are in a row
            gap: 4, // Space between text and icon
          },
          !isSelected && !isDark && Shadows.light,
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterText,
            { color: isSelected ? "#fff" : theme.text },
          ]}
        >
          {city === "الكل" ? t("الكل") : city}
        </Text>
        {isSelected && city !== "الكل" && (
          <Ionicons name="close-circle" size={16} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };

  const renderCategoryFilterItem = (category: string, index: number) => {
    const isSelected =
      category === "الكل"
        ? selectedCategories.length === 0
        : selectedCategories.includes(category);

    const categoryData = CATEGORIES[category as keyof typeof CATEGORIES];
    const label = category === "الكل" ? t("الكل") : t(categoryData?.label);

    return (
      <TouchableOpacity
        key={category}
        onPress={() => toggleCategory(category)}
        style={[
          styles.filterChip,
          {
            backgroundColor: isSelected ? theme.primary : theme.card,
            borderColor: isSelected ? theme.primary : theme.border,
            flexDirection: "row",
            gap: 4,
          },
          !isSelected && !isDark && Shadows.light,
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterText,
            { color: isSelected ? "#fff" : theme.text },
          ]}
        >
          {label}
        </Text>
        {isSelected && category !== "الكل" && (
          <Ionicons name="close-circle" size={16} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t("tabs.explore")}
          </Text>
          <View style={[styles.resultBadge, { backgroundColor: theme.card }]}>
            <Text style={[styles.resultCount, { color: theme.primary }]}>
              {filteredMosques.length} مساجد
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.icon} />
          <TextInput
            placeholder={t("search.placeholder")}
            placeholderTextColor={theme.icon}
            style={[styles.input, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={theme.icon} />
            </TouchableOpacity>
          )}
        </View>

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
            style={{ flexGrow: 0, marginBottom: Spacing.sm }}
          >
            {cities.map((city, index) => renderCityFilterItem(city, index))}
            {selectedCities.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelectedCities([]);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    width: 40,
                    paddingHorizontal: 0,
                  },
                ]}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            )}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
            style={{ flexGrow: 0 }}
          >
            {categories.map((category, index) =>
              renderCategoryFilterItem(category, index),
            )}
            {selectedCategories.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelectedCategories([]);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    width: 40,
                    paddingHorizontal: 0,
                  },
                ]}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={filteredMosques}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            layout={LinearTransition.springify()}
            style={{ marginBottom: Spacing.sm }}
          >
            <MosqueCard mosque={item} onPress={() => {}} />
          </Animated.View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={theme.icon} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              لا توجد مساجد مطابقة للبحث
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredMosques.length > 0 ? (
            <View
              style={[
                styles.mapPlaceholder,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Ionicons name="map-outline" size={32} color={theme.primary} />
              <Text style={[styles.mapText, { color: theme.icon }]}>
                الخريطة ستتوفر قريباً
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bdsans,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  resultCount: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 50,
    borderRadius: BorderRadius.lg, // More rounded for modern look
    borderWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.rsans,
    textAlign: "right",
    height: "100%",
  },
  filterContainer: {
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Fonts.mdsans,
    opacity: 0.7,
  },
  mapPlaceholder: {
    height: 120,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    opacity: 0.8,
  },
  mapText: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },
});
