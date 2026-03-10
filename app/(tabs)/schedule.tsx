import { MosqueCard } from "@/components/MosqueCard";
import { ScheduleEventCard } from "@/components/ScheduleEventCard";
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
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabKey = "events" | "mosques" | "schools";

export default function ScheduleScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>("events");

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

  // ── User location for distance calc ────────
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

  // Hydrate on mount
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

  // ── Loading state ────────────────────────────
  if (!isHydrated || !bookmarksHydrated) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // ── Today's date in Arabic ───────────────────
  const todayLabel = new Intl.DateTimeFormat("ar-DZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  // ── Tab counts ─────────────────────────────
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

  // ── Empty states ───────────────────────────
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

  // ── Refresh control ────────────────────────
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.headerTitle, { color: theme.tint }]}>
            {t("schedule.mySchedule")}
          </Text>
          <Text style={[styles.headerDate, { color: theme.tint + "70" }]}>
            {todayLabel}
          </Text>
        </View>
        <View
          style={[
            styles.headerBadge,
            {
              backgroundColor: isDark
                ? theme.primary + "20"
                : theme.primary + "12",
            },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={26}
            color={theme.primary + "70"}
          />
        </View>
      </View>

      {/* Segment Tabs */}
      <View
        style={[
          styles.segmentContainer,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.04)",
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                setActiveTab(tab.key);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.segmentTab,
                isActive && [
                  styles.segmentTabActive,
                  {
                    backgroundColor: theme.card,
                  },
                  isDark ? Shadows.dark : Shadows.light,
                ],
              ]}
            >
              {tab.icon === "mosque" ? (
                <MaterialCommunityIcons
                  name="mosque"
                  size={16}
                  color={isActive ? theme.primary : theme.textSecondary}
                />
              ) : (
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={isActive ? theme.primary : theme.textSecondary}
                />
              )}
              <Text
                style={[
                  styles.segmentLabel,
                  {
                    color: isActive ? theme.primary : theme.textSecondary,
                    fontFamily: isActive ? Fonts.bdsans : Fonts.rsans,
                  },
                ]}
              >
                {tab.label}
              </Text>
              {tabCounts[tab.key] > 0 && (
                <View
                  style={[
                    styles.segmentBadge,
                    {
                      backgroundColor: isActive
                        ? theme.primary + "20"
                        : "transparent",
                      borderRadius: BorderRadius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentBadgeText,
                      {
                        color: isActive ? theme.primary : theme.textSecondary,
                      },
                    ]}
                  >
                    {tabCounts[tab.key]}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Content based on active tab */}
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
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // ── Header ────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTextGroup: {
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.bdsans,
  },
  headerDate: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
    marginTop: 2,
  },
  headerBadge: {
    borderRadius: BorderRadius.full,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCount: {
    fontSize: 16,
    fontFamily: Fonts.bdsans,
  },
  // ── Segment tabs ───────────
  segmentContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: 4,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  segmentTabActive: {
    // backgroundColor set dynamically
  },
  segmentLabel: {
    fontSize: 13,
  },
  segmentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
  },
  segmentBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.mdsans,
  },
  // ── List ──────────────────
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  // ── Empty state ───────────
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
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.bdsans,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
    textAlign: "center",
    lineHeight: 22,
  },
  // ── School card ────────────
  schoolCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  schoolImage: {
    width: 100,
    height: 100,
  },
  schoolContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
    gap: 4,
  },
  schoolName: {
    fontSize: 15,
    fontFamily: Fonts.bdsans,
    textAlign: "right",
  },
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
  schoolProgramText: {
    fontSize: 11,
    fontFamily: Fonts.rsans,
  },
});
