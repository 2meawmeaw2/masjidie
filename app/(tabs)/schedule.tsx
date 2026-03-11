import { MosqueCard } from "@/components/MosqueCard";
import { ScheduleEventCard } from "@/components/ScheduleEventCard";
import { SmoothAnimations } from "@/constants/animations";
import { IslamicSchool, Mosque } from "@/constants/mockData";
import {
  BorderRadius,
  Colors,
  Fonts,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getDistanceKm, getPreferredLocation } from "@/lib/location";
import { useBookmarksStore } from "@/lib/stores/bookmarksStore";
import { useIslamicSchoolsStore } from "@/lib/stores/islamicSchoolsStore";
import { useMosquesStore } from "@/lib/stores/mosquesStore";
import { useScheduleStore } from "@/lib/stores/scheduleStore";
import { ScheduledEvent } from "@/lib/types/schedule";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
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
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabKey = "events" | "mosques" | "schools";

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.6,
};

// ── Animated Tab Item ──────────────────────────────────────────────────────────
function AnimatedTabItem({
  tab,
  isActive,
  theme,
  onPress,
  count,
}: {
  tab: { key: TabKey; label: string; icon: string };
  isActive: boolean;
  theme: any;
  onPress: () => void;
  count: number;
}) {
  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(isActive ? 1.08 : 0.9, {
            duration: 2000,
            easing: SmoothAnimations.entering,
          }),
        },
      ],
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isActive ? 1 : 0.55, {
        duration: 2000,
        easing: SmoothAnimations.entering,
      }),
      color: withTiming(isActive ? "black" : "white", {
        duration: 2000,
        easing: SmoothAnimations.entering,
      }),
      transform: [
        {
          translateY: withTiming(isActive ? 0 : 1, {
            duration: 2000,
            easing: SmoothAnimations.entering,
          }),
        },
      ],
    };
  });

  const badgeStyle = useAnimatedStyle(() => {
    return {
      opacity: count > 0 ? 1 : 0,
      transform: [
        {
          scale: withTiming(isActive ? 1 : 0.85, {
            duration: 2000,
            easing: SmoothAnimations.entering,
          }),
        },
      ],
      backgroundColor: withTiming(
        isActive ? theme.primary + "20" : "transparent",
        { duration: 2000, easing: SmoothAnimations.entering },
      ),
    };
  });

  const badgeTextStyle = useAnimatedStyle(() => {
    return {
      color: withTiming(isActive ? theme.primary : theme.textSecondary, {
        duration: 2000,
        easing: SmoothAnimations.entering,
      }),
    };
  });

  // We can't pass animated color directly to Ionicons, so we render two icons
  // and crossfade between them — clean and reliable.
  const inactiveIconStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isActive ? 0 : 1, {
        duration: 2000,
        easing: SmoothAnimations.entering,
      }),
      position: "absolute",
    };
  });

  const activeIconStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isActive ? 1 : 0, {
        duration: 2000,
        easing: SmoothAnimations.entering,
      }),
      position: "absolute",
    };
  });

  return (
    <Pressable style={styles.segmentTab} onPress={onPress}>
      {/* Icon crossfade */}
      <Animated.View style={[{ width: 16, height: 16 }, iconStyle]}>
        <Animated.View style={inactiveIconStyle}>
          {tab.icon === "mosque" ? (
            <MaterialCommunityIcons
              name="mosque"
              size={16}
              color={theme.textSecondary}
            />
          ) : (
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={theme.textSecondary}
            />
          )}
        </Animated.View>
        <Animated.View style={activeIconStyle}>
          {tab.icon === "mosque" ? (
            <MaterialCommunityIcons
              name="mosque"
              size={16}
              color={theme.primary}
            />
          ) : (
            <Ionicons name={tab.icon as any} size={16} color={theme.primary} />
          )}
        </Animated.View>
      </Animated.View>

      {/* Label */}
      <Animated.Text
        style={[
          styles.segmentLabel,
          { fontFamily: Fonts.rsans, color: "white" },
          labelStyle,
        ]}
      >
        {tab.label}
      </Animated.Text>

      {/* Badge */}
      {count > 0 && (
        <Animated.View
          style={[
            styles.segmentBadge,
            { borderRadius: BorderRadius.sm },
            badgeStyle,
          ]}
        >
          <Animated.Text style={[styles.segmentBadgeText, badgeTextStyle]}>
            {count}
          </Animated.Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function ScheduleScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  const tabKeys: TabKey[] = ["events", "mosques", "schools"];
  const [activeTab, setActiveTab] = useState<TabKey>("events");

  // Reanimated shared values for the pill
  const activeIndex = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const handleTabPress = (tab: TabKey, index: number) => {
    setActiveTab(tab);
    activeIndex.value = withSpring(index, SPRING_CONFIG);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ── Stores ─────────────────────────────────
  const { events, isHydrated, hydrate, removeEvent, getSortedEvents } =
    useScheduleStore();

  const {
    savedMosqueIds,
    savedSchoolIds,
    isHydrated: bookmarksHydrated,
    hydrate: hydrateBookmarks,
  } = useBookmarksStore();

  const { mosques, fetchMosques } = useMosquesStore();
  const { schools, fetchSchools } = useIslamicSchoolsStore();

  const [refreshing, setRefreshing] = useState(false);

  const userLocationRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationReady, setLocationReady] = useState(false);

  useEffect(() => {
    getPreferredLocation().then((loc) => {
      userLocationRef.current = loc;
      setLocationReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) hydrate();
    if (!bookmarksHydrated) hydrateBookmarks();
    fetchMosques();
    fetchSchools();
  }, []);

  const sorted = getSortedEvents();

  const savedMosques = useMemo(() => {
    const filtered = mosques.filter((m) => savedMosqueIds.includes(m.id));
    const loc = userLocationRef.current;
    if (!loc) return filtered;
    return filtered.map((m) => ({
      ...m,
      distance:
        m.latitude && m.longitude
          ? getDistanceKm(loc.latitude, loc.longitude, m.latitude, m.longitude)
          : 0,
    }));
  }, [mosques, savedMosqueIds, locationReady]);

  const savedSchools = useMemo(
    () => schools.filter((s) => savedSchoolIds.includes(s.id)),
    [schools, savedSchoolIds],
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeEvent(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    [removeEvent],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([hydrate(), hydrateBookmarks()]);
    await Promise.all([fetchMosques(true), fetchSchools(true)]);
    setRefreshing(false);
  }, [hydrate, hydrateBookmarks, fetchMosques, fetchSchools]);

  // ── Sliding pill animated style ─────────────────────────────────────────────
  // Must be before any early returns to obey Rules of Hooks
  const TAB_COUNT = 3;
  const PADDING_H = 4;
  const GAP = 4;

  const pillStyle = useAnimatedStyle(() => {
    if (containerWidth === 0) return {};
    const availableWidth = containerWidth - PADDING_H * 2;
    const tabWidth = (availableWidth - GAP * (TAB_COUNT - 1)) / TAB_COUNT;
    const translateX = -activeIndex.value * (tabWidth + GAP);
    return {
      width: tabWidth,
      transform: [{ translateX: withSpring(translateX, SPRING_CONFIG) }],
    };
  });

  if (!isHydrated || !bookmarksHydrated) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const todayLabel = new Intl.DateTimeFormat("ar-DZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const tabCounts: Record<TabKey, number> = {
    events: events.length,
    mosques: savedMosqueIds.length,
    schools: savedSchoolIds.length,
  };

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "events", label: t("bookmarks.events"), icon: "calendar-outline" },
    { key: "mosques", label: t("bookmarks.mosques"), icon: "mosque" },
    { key: "schools", label: t("bookmarks.schools"), icon: "school-outline" },
  ];

  // ── Empty states ───────────────────────────────────────────────────────────
  const renderEventsEmpty = () => (
    <View style={styles.emptyContainer}>
      <View
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
          name="calendar-outline"
          size={48}
          color={theme.primary + "70"}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {t("schedule.noSavedEvents")}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {t("schedule.noSavedEventsHint")}
      </Text>
    </View>
  );

  const renderMosquesEmpty = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconBg,
          {
            backgroundColor: isDark
              ? theme.primary + "15"
              : theme.primary + "10",
          },
        ]}
      >
        <MaterialCommunityIcons
          name="mosque"
          size={48}
          color={theme.primary + "70"}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {t("bookmarks.no_saved_mosques")}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {t("bookmarks.no_saved_mosques_hint")}
      </Text>
    </View>
  );

  const renderSchoolsEmpty = () => (
    <View style={styles.emptyContainer}>
      <View
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
          name="school-outline"
          size={48}
          color={theme.primary + "70"}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {t("bookmarks.no_saved_schools")}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {t("bookmarks.no_saved_schools_hint")}
      </Text>
    </View>
  );

  const renderEventItem = ({ item }: { item: ScheduledEvent }) => (
    <ScheduleEventCard event={item} onDelete={handleDelete} />
  );

  const renderMosqueItem = ({ item }: { item: Mosque }) => (
    <MosqueCard mosque={item} />
  );

  const renderSchoolItem = ({ item }: { item: IslamicSchool }) => (
    <Pressable
      onPress={() => router.push(`/details/schoolInfo?id=${item.id}`)}
      style={[
        styles.schoolCard,
        { backgroundColor: theme.card },
        isDark ? Shadows.dark : Shadows.light,
      ]}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.schoolImage}
        contentFit="cover"
        transition={400}
      />
      <View style={styles.schoolContent}>
        <Text
          style={[styles.schoolName, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={styles.schoolLocationRow}>
          <Ionicons
            name="location-outline"
            size={13}
            color={theme.textSecondary}
          />
          <Text
            style={[styles.schoolCity, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.city} - {item.address}
          </Text>
        </View>
        {item.programs.length > 0 && (
          <View style={styles.schoolProgramsRow}>
            {item.programs.slice(0, 2).map((prog, i) => (
              <View
                key={i}
                style={[
                  styles.schoolProgramTag,
                  { backgroundColor: theme.primary + "14" },
                ]}
              >
                <Text
                  style={[styles.schoolProgramText, { color: theme.primary }]}
                >
                  {prog}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.primary}
      colors={[theme.primary]}
    />
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top },
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
            height: 200,
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
        ]}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.headerTitle, { color: "white" }]}>
            {t("schedule.mySchedule")}
          </Text>
          <Text style={[styles.headerDate, { color: "#ffffff90" }]}>
            {todayLabel}
          </Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: "#ffffff50" }]}>
          <Ionicons name="calendar-outline" size={26} color="white" />
        </View>
      </View>

      {/* ── Animated Segment Tabs ── */}
      <View
        style={[styles.segmentContainer, { backgroundColor: "#ffffff70" }]}
        onLayout={(e: LayoutChangeEvent) =>
          setContainerWidth(e.nativeEvent.layout.width)
        }
      >
        {/* Sliding white pill — rendered behind the tab items */}
        <Animated.View
          style={[
            styles.pill,
            isDark ? Shadows.dark : Shadows.light,
            pillStyle,
          ]}
        />

        {tabs.map((tab, index) => (
          <AnimatedTabItem
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            theme={theme}
            count={tabCounts[tab.key]}
            onPress={() => handleTabPress(tab.key, index)}
          />
        ))}
      </View>

      {/* Content */}
      {activeTab === "events" && (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          ListEmptyComponent={renderEventsEmpty}
          contentContainerStyle={[
            styles.listContent,
            sorted.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        />
      )}

      {activeTab === "mosques" && (
        <FlatList
          data={savedMosques}
          keyExtractor={(item) => item.id}
          renderItem={renderMosqueItem}
          ListEmptyComponent={renderMosquesEmpty}
          contentContainerStyle={[
            styles.listContent,
            savedMosques.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        />
      )}

      {activeTab === "schools" && (
        <FlatList
          data={savedSchools}
          keyExtractor={(item) => item.id}
          renderItem={renderSchoolItem}
          ListEmptyComponent={renderSchoolsEmpty}
          contentContainerStyle={[
            styles.listContent,
            savedSchools.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTextGroup: { alignItems: "flex-start" },
  headerTitle: { fontSize: 28, fontFamily: Fonts.bdsans },
  headerDate: { fontSize: 14, fontFamily: Fonts.rsans, marginTop: 2 },
  headerBadge: {
    borderRadius: BorderRadius.full,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Segment tabs ─────────────────────────────────────────────────────────────
  segmentContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 4,
    // Needed so the absolute pill sits inside correctly
    position: "relative",
  },
  // The white sliding pill — absolutely positioned, behind tab items via zIndex
  pill: {
    position: "absolute",
    top: 8,
    left: 4,
    bottom: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: "white",
    zIndex: 0,
  },
  segmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
    zIndex: 1, // sit above the pill
  },
  segmentLabel: { fontSize: 13 },
  segmentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
  },
  segmentBadgeText: { fontSize: 11, fontFamily: Fonts.mdsans },

  // ── List ──────────────────────────────────────────────────────────────────────
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  listContentEmpty: { flexGrow: 1, justifyContent: "center" },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: { fontSize: 20, fontFamily: Fonts.bdsans, textAlign: "center" },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
    textAlign: "center",
    lineHeight: 22,
  },

  // ── School card ───────────────────────────────────────────────────────────────
  schoolCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  schoolImage: { width: 100, height: 100 },
  schoolContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
    gap: 4,
  },
  schoolName: { fontSize: 15, fontFamily: Fonts.bdsans, textAlign: "right" },
  schoolLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  schoolCity: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
    textAlign: "right",
  },
  schoolProgramsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  schoolProgramTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  schoolProgramText: { fontSize: 11, fontFamily: Fonts.rsans },
});
