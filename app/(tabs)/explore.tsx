import { ExploreListFooter } from "@/components/ExploreListFooter";
import { MosqueCard } from "@/components/MosqueCard";
import {
  BorderRadius,
  Colors,
  Fonts,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDebounce } from "@/hooks/use-debounce";
import { useMosquePagination } from "@/hooks/use-mosque-pagination";
import { fetchMosqueCities } from "@/lib/api/mosquesApi";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Portal } from "@gorhom/portal";
import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  LinearTransition,
  SlideInRight,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Distance range options ──────────────────────────
type DistanceRange = "any" | "near" | "medium" | "far";

const DISTANCE_OPTIONS: {
  key: DistanceRange;
  labelKey: string;
  icon: string;
  max: number;
}[] = [
  {
    key: "near",
    labelKey: "explore.distance_near",
    icon: "walk-outline",
    max: 2,
  },
  {
    key: "medium",
    labelKey: "explore.distance_medium",
    icon: "car-outline",
    max: 10,
  },
  {
    key: "far",
    labelKey: "explore.distance_far",
    icon: "bus-outline",
    max: 25,
  },
];

// ── Sort options ────────────────────────────────────
type SortOption = "distance" | "name";

const SORT_OPTIONS: { key: SortOption; labelKey: string; icon: string }[] = [
  {
    key: "distance",
    labelKey: "explore.sort_nearest",
    icon: "navigate-outline",
  },
  { key: "name", labelKey: "explore.sort_name", icon: "text-outline" },
];

// ── Item layout constants for FlatList ──────────────
const ITEM_HEIGHT = 110 + 16; // card height + marginBottom

// ── Animated Pressable Chip ──────────────────────────
function AnimatedChip({
  onPress,
  style,
  children,
}: {
  onPress: () => void;
  style: any;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  return (
    <Animated.View layout={LinearTransition.duration(500)} style={animStyle}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={0.85}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ExploreScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  // ── Filter state ────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedDistance, setSelectedDistance] =
    useState<DistanceRange>("any");
  const [sortBy, setSortBy] = useState<SortOption>("distance");

  const debouncedSearch = useDebounce(searchQuery, 300);

  // ── Server-side pagination ──────────────────────
  const {
    mosques,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    loadMore,
    refresh,
  } = useMosquePagination({
    searchQuery: debouncedSearch,
    selectedCities,
    selectedDistance,
    sortBy,
  });

  // ── Cities list (fetched independently) ─────────
  const [cities, setCities] = useState<string[]>([]);
  useEffect(() => {
    fetchMosqueCities().then(setCities);
  }, []);

  // ── Pending state (bottom sheet) ────────────────
  const [pendingCities, setPendingCities] = useState<string[]>([]);
  const [pendingDistance, setPendingDistance] = useState<DistanceRange>("any");
  const [pendingSortBy, setPendingSortBy] = useState<SortOption>("distance");

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["60%", "85%"], []);
  const searchInputRef = useRef<TextInput>(null);

  // Animated filter button
  const filterBtnScale = useSharedValue(1);
  const filterBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterBtnScale.value }],
  }));

  // Count only city + distance (sort doesn't count as a "filter")
  const activeFilterCount =
    selectedCities.length + (selectedDistance !== "any" ? 1 : 0);

  // ── Bottom sheet handlers ───────────────────────
  const openFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    filterBtnScale.value = withSequence(
      withSpring(0.85, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    setPendingCities([...selectedCities]);
    setPendingDistance(selectedDistance);
    setPendingSortBy(sortBy);
    bottomSheetRef.current?.snapToIndex(0);
  }, [selectedCities, selectedDistance, sortBy]);

  const applyFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCities(pendingCities);
    setSelectedDistance(pendingDistance);
    setSortBy(pendingSortBy);
    bottomSheetRef.current?.close();
  }, [pendingCities, pendingDistance, pendingSortBy]);

  const resetFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingCities([]);
    setPendingDistance("any");
    setPendingSortBy("distance");
  }, []);

  const clearAllFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCities([]);
    setSelectedDistance("any");
    setSortBy("distance");
  }, []);

  const togglePendingCity = useCallback((city: string) => {
    Haptics.selectionAsync();
    setPendingCities((prev) => {
      if (prev.includes(city)) return prev.filter((c) => c !== city);
      return [...prev, city];
    });
  }, []);

  const removeFilter = useCallback(
    (type: "city" | "distance", value: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (type === "city") {
        setSelectedCities((prev) => prev.filter((c) => c !== value));
      } else {
        setSelectedDistance("any");
      }
    },
    [],
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    [],
  );

  const pendingCount =
    pendingCities.length + (pendingDistance !== "any" ? 1 : 0);

  // Build active chip data for the header strip
  const activeChips = useMemo(() => {
    const chips: { type: "city" | "distance"; value: string; label: string }[] =
      [];
    selectedCities.forEach((c) =>
      chips.push({ type: "city", value: c, label: c }),
    );
    if (selectedDistance !== "any") {
      const opt = DISTANCE_OPTIONS.find((d) => d.key === selectedDistance);
      if (opt)
        chips.push({
          type: "distance",
          value: opt.key,
          label: t(opt.labelKey),
        });
    }
    return chips;
  }, [selectedCities, selectedDistance]);

  // ── FlatList helpers ────────────────────────────
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof mosques)[0] }) => (
      <View style={{ marginBottom: Spacing.md }}>
        <MosqueCard mosque={item} onPress={() => {}} />
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: (typeof mosques)[0]) => item.id, []);

  const listFooter = useCallback(
    () => (
      <ExploreListFooter
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        totalCount={totalCount}
        dataLength={mosques.length}
      />
    ),
    [isLoadingMore, hasMore, totalCount, mosques.length],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t("tabs.explore")}
          </Text>
          <View
            style={[
              styles.resultBadge,
              {
                backgroundColor: isDark
                  ? theme.primary + "18"
                  : theme.primary + "12",
              },
            ]}
          >
            <Ionicons name="location" size={13} color={theme.primary} />
            <Text style={[styles.resultCount, { color: theme.primary }]}>
              {totalCount}
            </Text>
          </View>
        </View>

        {/* Search + Filter Row */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
              !isDark && Shadows.light,
            ]}
          >
            <Ionicons name="search" size={20} color={theme.icon} />
            <TextInput
              ref={searchInputRef}
              placeholder={t("search.placeholder")}
              placeholderTextColor={theme.icon}
              style={[styles.input, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={theme.icon} />
              </TouchableOpacity>
            )}
          </View>

          <Animated.View style={filterBtnStyle}>
            <TouchableOpacity
              onPress={openFilters}
              activeOpacity={0.7}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    activeFilterCount > 0 ? theme.primary : theme.card,
                  borderColor:
                    activeFilterCount > 0 ? theme.primary : theme.border,
                },
                !isDark && activeFilterCount === 0 && Shadows.light,
              ]}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={activeFilterCount > 0 ? "#fff" : theme.icon}
              />
              {activeFilterCount > 0 && (
                <Animated.View
                  entering={ZoomIn.springify().damping(12)}
                  exiting={ZoomOut.duration(150)}
                  style={styles.filterBadge}
                >
                  <Text style={styles.filterBadgeText}>
                    {activeFilterCount}
                  </Text>
                </Animated.View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Active Filter Chips */}
        {activeChips.length > 0 && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={LinearTransition.duration(500)}
            style={styles.activeFiltersRow}
          >
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={activeChips}
              keyExtractor={(item) => `${item.type}-${item.value}`}
              contentContainerStyle={{ gap: 6 }}
              ListFooterComponent={
                <AnimatedChip
                  onPress={clearAllFilters}
                  style={[
                    styles.clearAllChip,
                    {
                      borderColor: theme.error + "40",
                      backgroundColor: theme.error + "10",
                    },
                  ]}
                >
                  <Text style={[styles.clearAllText, { color: theme.error }]}>
                    {t("explore.clear_all")}
                  </Text>
                </AnimatedChip>
              }
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={SlideInRight.delay(index * 60)
                    .springify()
                    .damping(14)}
                  exiting={SlideOutRight.duration(200)}
                  layout={LinearTransition.springify().damping(14)}
                >
                  <AnimatedChip
                    onPress={() => removeFilter(item.type, item.value)}
                    style={[
                      styles.activeChip,
                      {
                        backgroundColor: isDark
                          ? theme.primary + "20"
                          : theme.primary + "10",
                        borderColor: theme.primary + "30",
                      },
                    ]}
                  >
                    <Text
                      style={[styles.activeChipText, { color: theme.primary }]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    <Ionicons name="close" size={14} color={theme.primary} />
                  </AnimatedChip>
                </Animated.View>
              )}
            />
          </Animated.View>
        )}
      </View>

      {/* Mosque List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            {t("explore.loading")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={mosques}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS !== "web"}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={false}
          onRefresh={refresh}
          ListFooterComponent={listFooter}
          ListEmptyComponent={
            <Animated.View
              entering={FadeIn.delay(200).duration(400)}
              style={styles.emptyState}
            >
              <Animated.View
                entering={ZoomIn.delay(300).springify().damping(10)}
                style={[
                  styles.emptyIconBg,
                  {
                    backgroundColor: isDark
                      ? theme.primary + "15"
                      : theme.primary + "10",
                  },
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={40}
                  color={theme.primary + "70"}
                />
              </Animated.View>
              <Animated.Text
                entering={FadeInDown.delay(400).springify()}
                style={[styles.emptyText, { color: theme.text }]}
              >
                {t("explore.no_results")}
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(500).springify()}
                style={[styles.emptySubtext, { color: theme.textSecondary }]}
              >
                {t("explore.no_results_hint")}
              </Animated.Text>
              {activeFilterCount > 0 && (
                <Animated.View entering={FadeInDown.delay(600).springify()}>
                  <AnimatedChip
                    onPress={clearAllFilters}
                    style={[
                      styles.emptyResetBtn,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text style={styles.emptyResetText}>
                      {t("explore.reset_filters")}
                    </Text>
                  </AnimatedChip>
                </Animated.View>
              )}
            </Animated.View>
          }
        />
      )}

      {/* ── Bottom Sheet ──────────────────────────── */}
      <Portal>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{
            backgroundColor: theme.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
          handleIndicatorStyle={{
            backgroundColor: theme.icon + "60",
            width: 40,
          }}
          style={styles.bottomSheet}
        >
          {/* Sheet Header */}
          <View
            style={[
              styles.sheetHeader,
              { borderBottomColor: theme.border + "50" },
            ]}
          >
            <TouchableOpacity onPress={resetFilters}>
              <Text
                style={[
                  styles.sheetResetText,
                  {
                    color: pendingCount > 0 ? theme.error : theme.icon,
                    opacity: pendingCount > 0 ? 1 : 0.4,
                  },
                ]}
              >
                {t("explore.reset")}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {t("explore.filter_results")}
            </Text>
            <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
              <Ionicons
                name="close-circle"
                size={28}
                color={theme.icon + "80"}
              />
            </TouchableOpacity>
          </View>

          <BottomSheetScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Cities Section ── */}
            <Animated.View
              entering={FadeInUp.delay(80).springify().damping(14)}
              style={styles.filterSection}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t("explore.city")}
                </Text>
                {pendingCities.length > 0 && (
                  <Animated.View
                    layout={LinearTransition.duration(500)}
                    entering={FadeIn.duration(500)}
                    exiting={FadeOut.duration(500)}
                    key={`badge-${pendingCities.length > 0 ? "dsa" : "das"}`}
                    style={[
                      styles.sectionBadge,
                      { backgroundColor: theme.primary + "15" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionBadgeText,
                        { color: theme.primary },
                      ]}
                    >
                      {pendingCities.length}
                    </Text>
                  </Animated.View>
                )}
              </View>
              <View style={styles.chipGrid}>
                {cities.map((city, index) => {
                  const isSelected = pendingCities.includes(city);
                  return (
                    <Animated.View
                      key={city}
                      entering={FadeInDown.delay(120 + index * 50)
                        .springify()
                        .damping(14)}
                    >
                      <AnimatedChip
                        onPress={() => togglePendingCity(city)}
                        style={[
                          styles.sheetChip,
                          {
                            backgroundColor: isSelected
                              ? theme.primary
                              : theme.card,
                            borderColor: isSelected
                              ? theme.primary
                              : theme.border,
                          },
                          !isDark && !isSelected && Shadows.light,
                        ]}
                      >
                        {isSelected && (
                          <Animated.View entering={ZoomIn.duration(200)}>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          </Animated.View>
                        )}
                        <Text
                          style={[
                            styles.sheetChipText,
                            { color: isSelected ? "#fff" : theme.text },
                          ]}
                        >
                          {city}
                        </Text>
                      </AnimatedChip>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>

            {/* ── Distance Section ── */}
            <Animated.View
              entering={FadeInUp.delay(200).springify().damping(14)}
              style={styles.filterSection}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="speedometer-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t("explore.distance_label")}
                </Text>
              </View>
              <View style={styles.chipGrid}>
                {DISTANCE_OPTIONS.map((opt, index) => {
                  const isSelected = pendingDistance === opt.key;
                  return (
                    <Animated.View
                      key={opt.key}
                      entering={FadeInDown.delay(260 + index * 50)
                        .springify()
                        .damping(14)}
                    >
                      <AnimatedChip
                        onPress={() => {
                          Haptics.selectionAsync();
                          setPendingDistance(
                            pendingDistance === opt.key ? "any" : opt.key,
                          );
                        }}
                        style={[
                          styles.sheetChip,
                          {
                            backgroundColor: isSelected
                              ? theme.primary
                              : theme.card,
                            borderColor: isSelected
                              ? theme.primary
                              : theme.border,
                          },
                          !isDark && !isSelected && Shadows.light,
                        ]}
                      >
                        <Ionicons
                          name={opt.icon as any}
                          size={16}
                          color={isSelected ? "#fff" : theme.icon}
                        />
                        <Text
                          style={[
                            styles.sheetChipText,
                            { color: isSelected ? "#fff" : theme.text },
                          ]}
                        >
                          {t(opt.labelKey)}
                        </Text>
                      </AnimatedChip>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>

            {/* ── Sort Section ── */}
            <Animated.View
              entering={FadeInUp.delay(340).springify().damping(14)}
              style={styles.filterSection}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="swap-vertical-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t("explore.sort")}
                </Text>
              </View>
              <View style={styles.chipGrid}>
                {SORT_OPTIONS.map((opt, index) => {
                  const isSelected = pendingSortBy === opt.key;
                  return (
                    <Animated.View
                      key={opt.key}
                      entering={FadeInDown.delay(400 + index * 60)
                        .springify()
                        .damping(14)}
                      style={{ flex: 1 }}
                    >
                      <AnimatedChip
                        onPress={() => {
                          Haptics.selectionAsync();
                          setPendingSortBy(opt.key);
                        }}
                        style={[
                          styles.sortChip,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? theme.primary + "20"
                                : theme.primary + "10"
                              : theme.card,
                            borderColor: isSelected
                              ? theme.primary
                              : theme.border,
                          },
                          !isDark && !isSelected && Shadows.light,
                        ]}
                      >
                        <Ionicons
                          name={opt.icon as any}
                          size={18}
                          color={isSelected ? theme.primary : theme.icon}
                        />
                        <Text
                          style={[
                            styles.sheetChipText,
                            {
                              color: isSelected ? theme.primary : theme.text,
                              fontFamily: isSelected
                                ? Fonts.bdsans
                                : Fonts.mdsans,
                            },
                          ]}
                        >
                          {t(opt.labelKey)}
                        </Text>
                        {isSelected && (
                          <Animated.View entering={ZoomIn.duration(200)}>
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color={theme.primary}
                            />
                          </Animated.View>
                        )}
                      </AnimatedChip>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>
          </BottomSheetScrollView>

          {/* Apply Button */}
          <Animated.View
            entering={FadeInDown.delay(450).springify().damping(12)}
            style={[
              styles.sheetFooter,
              { borderTopColor: theme.border + "50" },
            ]}
          >
            <AnimatedChip
              onPress={applyFilters}
              style={[styles.applyButton, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.applyText}>
                {pendingCount > 0
                  ? t("explore.show_results_count", { count: pendingCount })
                  : t("explore.show_results")}
              </Text>
            </AnimatedChip>
          </Animated.View>
        </BottomSheet>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  resultCount: {
    fontSize: 14,
    fontFamily: Fonts.bdsans,
  },

  // Search row
  searchRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.rsans,
    textAlign: "right",
    height: "100%",
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: Fonts.bdsans,
  },

  // Active filter chips
  activeFiltersRow: {
    marginTop: 2,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  activeChipText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },
  clearAllChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clearAllText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
  },

  // List
  listContent: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 17,
    fontFamily: Fonts.bdsans,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
    textAlign: "center",
  },
  emptyResetBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  emptyResetText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },

  // Bottom Sheet
  bottomSheet: {
    ...Platform.select({
      android: { elevation: 10 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: Fonts.bdsans,
  },
  sheetResetText: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },
  sheetContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },

  // Filter sections
  filterSection: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bdsans,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginStart: 4,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.bdsans,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sheetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  sortChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  sheetChipText: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },

  // Footer
  sheetFooter: {
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : Spacing.md,
    borderTopWidth: 1,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: BorderRadius.lg,
  },
  applyText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: Fonts.bdsans,
  },
});
