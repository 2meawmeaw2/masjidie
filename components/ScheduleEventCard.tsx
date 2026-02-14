import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  BorderRadius,
  Fonts,
  Shadows,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Badge } from "@/components/ui/Badge";
import { CATEGORIES } from "@/constants/categories";
import {
  ScheduledEvent,
  resolveDisplayTime,
  PRAYER_LABELS,
  PrayerTimesMap,
} from "@/lib/types/schedule";

interface ScheduleEventCardProps {
  event: ScheduledEvent;
  prayerTimes?: PrayerTimesMap;
  onDelete: (id: string) => void;
  onPress?: (event: ScheduledEvent) => void;
}

export function ScheduleEventCard({
  event,
  prayerTimes,
  onDelete,
  onPress,
}: ScheduleEventCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const category = CATEGORIES[event.categoryId];
  const displayTime = resolveDisplayTime(event, prayerTimes);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(event)}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        isDark ? {} : Shadows.light,
      ]}
    >
      {/* Time column */}
      <View
        style={[styles.timeColumn, { borderRightColor: theme.primary + "30" }]}
      >
        {event.anchor === "fixed" ? (
          <Ionicons name="time-outline" size={16} color={theme.primary} />
        ) : (
          <Ionicons name="moon-outline" size={16} color={theme.accent} />
        )}
        <Text
          style={[
            styles.timeText,
            {
              color: event.anchor === "fixed" ? theme.primary : theme.accent,
            },
          ]}
        >
          {displayTime}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Badge
            label={category?.label ?? ""}
            color={category?.color ?? theme.primary}
            variant="subtle"
          />
        </View>

        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {event.title}
        </Text>

        {event.anchor === "prayer" && (
          <View style={styles.prayerRow}>
            <Ionicons
              name="flag-outline"
              size={12}
              color={theme.textSecondary}
            />
            <Text style={[styles.prayerLabel, { color: theme.textSecondary }]}>
              {PRAYER_LABELS[event.prayerId]}
              {event.offsetMinutes !== 0 &&
                ` (${event.offsetMinutes > 0 ? "+" : ""}${event.offsetMinutes} د)`}
            </Text>
          </View>
        )}

        {event.note && (
          <Text
            style={[styles.note, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {event.note}
          </Text>
        )}
      </View>

      {/* Delete button */}
      <TouchableOpacity
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        onPress={() => onDelete(event.id)}
        style={styles.deleteBtn}
      >
        <Ionicons name="trash-outline" size={18} color={theme.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: "hidden",
    minHeight: 80,
  },
  timeColumn: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRightWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
    gap: 4,
  },
  topRow: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.bdsans,
    textAlign: "right",
    writingDirection: "rtl",
  },
  prayerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  prayerLabel: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
  },
  note: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
    textAlign: "right",
    marginTop: 2,
  },
  deleteBtn: {
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
});
