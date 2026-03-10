import Logo from "@/assets/logo.svg";
import { ExploreListFooter } from "@/components/ExploreListFooter";
import { MosqueCard } from "@/components/MosqueCard";
import { ActivityIndicator } from "@/components/ui/activityIndicator";
import { SmoothAnimations } from "@/constants/animations";
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
import * as NavigationBar from "expo-navigation-bar";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  LinearTransition,
  SlideInRight,
  SlideOutRight,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
  ZoomOut
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Animated wrapper (must live at module scope) ────
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

// ── Easing presets ──────────────────────────────────
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN_OUT = Easing.inOut(Easing.cubic);
const DURATION = { fast: 150, base: 220, slow: 350 };

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
const ITEM_HEIGHT = 110 + 16;

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
    scale.value = withTiming(0.92, {
      duration: DURATION.fast,
      easing: EASE_OUT,
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: DURATION.fast, easing: EASE_OUT });
  };

  return (
    <Animated.View
      layout={LinearTransition.duration(DURATION.slow).easing(EASE_IN_OUT)}
      style={animStyle}
    >
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

export default function HomeScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

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

  // ── Cities list ─────────────────────────────────
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

  const filterBtnScale = useSharedValue(1);
  const filterBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterBtnScale.value }],
  }));

  // ── Scroll-driven background animation ──────────
  const SCROLL_THRESHOLD = 50;
  const scrollY = useSharedValue(0);
  const bgTranslateY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      if (event.contentOffset.y > SCROLL_THRESHOLD) {
        bgTranslateY.value = withTiming(-100, {
          duration: 400,
          easing: SmoothAnimations.layout,
        });
      } else {
        bgTranslateY.value = withTiming(0, {
          duration: 400,
          easing: SmoothAnimations.layout,
        });
      }
    },
  });
  const bgAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bgTranslateY.value }],
  }));

  const activeFilterCount =
    selectedCities.length + (selectedDistance !== "any" ? 1 : 0);

  // ── Bottom sheet handlers ───────────────────────
  const openFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    filterBtnScale.value = withSequence(
      withTiming(0.85, { duration: DURATION.fast, easing: EASE_OUT }),
      withTiming(1, { duration: DURATION.base, easing: EASE_OUT }),
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
    setPendingCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    );
  }, []);

  const removeFilter = useCallback(
    (type: "city" | "distance", value: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (type === "city")
        setSelectedCities((prev) => prev.filter((c) => c !== value));
      else setSelectedDistance("any");
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
        onLoadMore={loadMore}
      />
    ),
    [isLoadingMore, hasMore, totalCount, mosques.length, loadMore],
  );

  const renderHeader = () => (
    <View style={[styles.headerContainer, { marginTop: insets.top }]}>
      <View>
        <Text style={[styles.appName, { color: "#fff" }]}>{t("app_name")}</Text>
      </View>
      <View
        style={{
          zIndex: 1,
          backgroundColor: "#e7f2f2",
          borderRadius: 10,
          padding: 5,
          width: 50,
          height: 50,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Logo width={60} height={60} />
      </View>
    </View>
  );

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("transparent");
    NavigationBar.setPositionAsync("absolute");
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: 280,
            zIndex: 0,
            backgroundColor: "#00996d",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            elevation: 8,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          },
          bgAnimStyle,
        ]}
      />
      <StatusBar
        backgroundColor="transparent"
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
      />
      {/*
      <AmbientBackground />
       */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        {renderHeader()}

        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
          {/* Search + Filter Row */}
          <View style={[styles.searchRow, { paddingHorizontal: Spacing.md }]}>
            <Animated.View
              layout={LinearTransition}
              style={[
                styles.searchBar,
                { backgroundColor: theme.card, borderColor: theme.border },
                !isDark && Shadows.light,
              ]}
            >
              <Animated.View layout={LinearTransition}>
                <Ionicons name="search" size={20} color={theme.icon} />
              </Animated.View>
              <TextInput
                ref={searchInputRef}
                placeholder={t("search.placeholder")}
                placeholderTextColor={theme.icon}
                style={[styles.input, { color: theme.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <AnimatedTouchableOpacity
                  onPress={() => setSearchQuery("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color={theme.icon} />
                </AnimatedTouchableOpacity>
              )}
            </Animated.View>
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
                    entering={ZoomIn.duration(DURATION.base).easing(EASE_OUT)}
                    exiting={ZoomOut.duration(DURATION.fast).easing(EASE_OUT)}
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
              entering={FadeIn.duration(DURATION.base).easing(EASE_OUT)}
              exiting={FadeOut.duration(DURATION.fast).easing(EASE_OUT)}
              layout={LinearTransition.duration(DURATION.slow).easing(
                EASE_IN_OUT,
              )}
              style={[
                styles.activeFiltersRow,
                {
                  paddingHorizontal: Spacing.md,
                },
              ]}
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
                        marginTop: 6,
                        backgroundColor: theme.error + "20",
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
                    entering={SlideInRight.delay(index * 50)
                      .duration(DURATION.base)
                      .easing(EASE_OUT)}
                    exiting={SlideOutRight.duration(DURATION.fast).easing(
                      EASE_OUT,
                    )}
                    layout={LinearTransition.duration(DURATION.slow).easing(
                      EASE_IN_OUT,
                    )}
                  >
                    <AnimatedChip
                      onPress={() => removeFilter(item.type, item.value)}
                      style={[
                        styles.activeChip,
                        {
                          backgroundColor: theme.background,
                          marginTop: 6,
                          borderColor: "white" + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activeChipText,
                          { color: theme.primary },
                        ]}
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
            <ActivityIndicator stroke={8} size={40} />
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
            refreshing={false}
            onRefresh={refresh}
            ListFooterComponent={listFooter}
            ListEmptyComponent={
              <Animated.View
                entering={FadeIn.delay(200)
                  .duration(DURATION.slow)
                  .easing(EASE_OUT)}
                style={styles.emptyState}
              >
                <Animated.View
                  entering={ZoomIn.delay(300)
                    .duration(DURATION.slow)
                    .easing(EASE_OUT)}
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
                  entering={FadeInDown.delay(400)
                    .duration(DURATION.slow)
                    .easing(EASE_OUT)}
                  style={[styles.emptyText, { color: theme.text }]}
                >
                  {t("explore.no_results")}
                </Animated.Text>
                <Animated.Text
                  entering={FadeInDown.delay(500)
                    .duration(DURATION.slow)
                    .easing(EASE_OUT)}
                  style={[styles.emptySubtext, { color: theme.textSecondary }]}
                >
                  {t("explore.no_results_hint")}
                </Animated.Text>
                {activeFilterCount > 0 && (
                  <Animated.View
                    entering={FadeInDown.delay(600)
                      .duration(DURATION.slow)
                      .easing(EASE_OUT)}
                  >
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
      </Animated.ScrollView>
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
              entering={FadeInUp.delay(80)
                .duration(DURATION.slow)
                .easing(EASE_OUT)}
              style={styles.filterSection}
            >
              <View style={styles.sheetSectionHeader}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.sheetSectionTitle, { color: theme.text }]}>
                  {t("explore.city")}
                </Text>
                {pendingCities.length > 0 && (
                  <Animated.View
                    layout={LinearTransition.duration(DURATION.slow).easing(
                      EASE_IN_OUT,
                    )}
                    entering={FadeIn.duration(DURATION.base).easing(EASE_OUT)}
                    exiting={FadeOut.duration(DURATION.fast).easing(EASE_OUT)}
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
                      entering={FadeInDown.delay(100 + index * 40)
                        .duration(DURATION.slow)
                        .easing(EASE_OUT)}
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
                          <Animated.View
                            entering={ZoomIn.duration(DURATION.base).easing(
                              EASE_OUT,
                            )}
                          >
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
              entering={FadeInUp.delay(180)
                .duration(DURATION.slow)
                .easing(EASE_OUT)}
              style={styles.filterSection}
            >
              <View style={styles.sheetSectionHeader}>
                <Ionicons
                  name="speedometer-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.sheetSectionTitle, { color: theme.text }]}>
                  {t("explore.distance_label")}
                </Text>
              </View>
              <View style={styles.chipGrid}>
                {DISTANCE_OPTIONS.map((opt, index) => {
                  const isSelected = pendingDistance === opt.key;
                  return (
                    <Animated.View
                      key={opt.key}
                      entering={FadeInDown.delay(220 + index * 40)
                        .duration(DURATION.slow)
                        .easing(EASE_OUT)}
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
              entering={FadeInUp.delay(300)
                .duration(DURATION.slow)
                .easing(EASE_OUT)}
              style={styles.filterSection}
            >
              <View style={styles.sheetSectionHeader}>
                <Ionicons
                  name="swap-vertical-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.sheetSectionTitle, { color: theme.text }]}>
                  {t("explore.sort")}
                </Text>
              </View>
              <View style={styles.chipGrid}>
                {SORT_OPTIONS.map((opt, index) => {
                  const isSelected = pendingSortBy === opt.key;
                  return (
                    <Animated.View
                      key={opt.key}
                      entering={FadeInDown.delay(340 + index * 50)
                        .duration(DURATION.slow)
                        .easing(EASE_OUT)}
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
                          <Animated.View
                            entering={ZoomIn.duration(DURATION.base).easing(
                              EASE_OUT,
                            )}
                          >
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
            entering={FadeInDown.delay(400)
              .duration(DURATION.slow)
              .easing(EASE_OUT)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  headerWrapper: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    paddingBottom: 0,
  },
  greeting: {
    fontSize: 16,
    fontFamily: Fonts.rsans,
    opacity: 0.8,
  },
  appName: {
    fontSize: 24,
    fontFamily: Fonts.bdsans,
  },
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
    backgroundColor: Colors.light.error,
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 200,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
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
  filterSection: {
    gap: Spacing.sm,
  },
  sheetSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sheetSectionTitle: {
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
