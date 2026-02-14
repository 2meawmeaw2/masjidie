import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  BorderRadius,
  Fonts,
  Shadows,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useScheduleStore } from "@/lib/stores/scheduleStore";
import { ScheduleEventCard } from "@/components/ScheduleEventCard";
import { ScheduledEvent } from "@/lib/types/schedule";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScheduleScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const { events, isHydrated, hydrate, removeEvent, getSortedEvents } =
    useScheduleStore();

  const [refreshing, setRefreshing] = useState(false);

  // Hydrate on mount
  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [isHydrated, hydrate]);

  const sorted = getSortedEvents();

  const handleDelete = useCallback(
    (id: string) => {
      removeEvent(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    [removeEvent],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await hydrate();
    setRefreshing(false);
  }, [hydrate]);

  // ── Loading state ────────────────────────────
  if (!isHydrated) {
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

  // ── Empty state ──────────────────────────────
  const renderEmpty = () => (
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
        لا توجد أحداث محفوظة
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        احفظ الأنشطة والدروس من صفحة الاستكشاف{"\n"}لتظهر هنا في جدولك اليومي
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: ScheduledEvent }) => (
    <ScheduleEventCard event={item} onDelete={handleDelete} />
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>جدولي</Text>
          <Text style={[styles.headerDate, { color: theme.textSecondary }]}>
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
          <Text style={[styles.headerCount, { color: theme.primary }]}>
            {events.length}
          </Text>
        </View>
      </View>

      {/* Event list */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          sorted.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />
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
    paddingBottom: Spacing.md,
  },
  headerTextGroup: {
    alignItems: "flex-end",
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
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCount: {
    fontSize: 16,
    fontFamily: Fonts.bdsans,
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
});
