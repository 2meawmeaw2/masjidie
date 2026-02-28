import { Badge } from "@/components/ui/Badge";
import { CATEGORIES } from "@/constants/categories";
import {
  BorderRadius,
  Colors,
  Fonts,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  PRAYER_LABELS,
  PrayerTimesMap,
  ScheduledEvent,
  resolveDisplayTime,
} from "@/lib/types/schedule";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const category = CATEGORIES[event.categoryId];
  const displayTime = resolveDisplayTime(event, prayerTimes);
  const isPrayer = event.anchor === "prayer";
  const anchorColor = isPrayer ? theme.accent : theme.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress?.(event)}
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.card,
          borderColor: isDark ? theme.border : "transparent",
        },
        isDark ? {} : Shadows.light,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.timeWrapper}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: anchorColor + "15" },
            ]}
          >
            <Ionicons
              name={isPrayer ? "moon-outline" : "time-outline"}
              size={16}
              color={anchorColor}
            />
          </View>
          <Text style={[styles.timeText, { color: anchorColor }]}>
            {displayTime}
          </Text>
          {isPrayer && (
            <Text
              style={[styles.relativeTimeText, { color: theme.textSecondary }]}
            >
              {PRAYER_LABELS[event.prayerId]}
            </Text>
          )}
        </View>

        <View style={styles.actionsWrapper}>
          <Badge
            label={
              event.categoryName || (category?.label ? t(category.label) : "")
            }
            color={category?.color ?? theme.primary}
            variant="subtle"
          />
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => onDelete(event.id)}
            style={styles.deleteBtn}
          >
            <Ionicons
              name="close-circle"
              size={22}
              color={theme.error + "80"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentRow}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {event.title}
        </Text>
      </View>

      {(event.mosqueName || event.note) && (
        <View style={styles.footerRow}>
          {event.mosqueName && (
            <TouchableOpacity
              activeOpacity={event.mapsUrl ? 0.6 : 1}
              onPress={() => {
                if (event.mapsUrl) {
                  Linking.openURL(event.mapsUrl);
                }
              }}
              style={[
                styles.detailBadge,
                {
                  backgroundColor: event.mapsUrl
                    ? theme.primary + "10"
                    : theme.background,
                  borderColor: event.mapsUrl
                    ? theme.primary + "30"
                    : "transparent",
                  borderWidth: 1,
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={14}
                color={event.mapsUrl ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.detailText,
                  {
                    color: event.mapsUrl ? theme.primary : theme.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {event.mosqueName}
              </Text>
            </TouchableOpacity>
          )}

          {event.note && (
            <View
              style={[
                styles.noteContainer,
                { backgroundColor: theme.background },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={14}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.noteText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {event.note}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 17,
    fontFamily: Fonts.bdsans,
  },
  relativeTimeText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
    opacity: 0.8,
  },
  actionsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  deleteBtn: {
    padding: 2,
  },
  contentRow: {
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.bdsans,
    lineHeight: 24,
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  detailBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    flex: 1,
    minWidth: "40%",
    gap: 6,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.rsans,
  },
});
