import LocationIcon from "@/assets/icons/location.svg";
import { Badge } from "@/components/ui/Badge";
import { CATEGORIES } from "@/constants/categories";
import { Activity } from "@/constants/mockData";
import {
  BorderRadius,
  Colors,
  Fonts,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ActivityCardProps {
  index: number;
  activity: Activity;
  mosqueName: string;
  imageUrl?: string;
  onPress: () => void;
}

const CARD_IMAGE_HEIGHT = 160;

export function ActivityCard({
  index,
  activity,
  mosqueName,
  imageUrl,
  onPress,
}: ActivityCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { t } = useTranslation();
  const category = CATEGORIES[activity.categoryId];
  const isDark = colorScheme === "dark";
  const getDayName = (dayIndex?: number) => {
    if (dayIndex === undefined) return "";
    const days = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    return days[dayIndex];
  };

  const timeString =
    activity.type === "recurring"
      ? `${getDayName(activity.dayOfWeek)} • ${activity.startTime}`
      : `${activity.date} • ${activity.startTime}`;

  return (
    <TouchableOpacity
      key={index}
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: isDark ? theme.border : "transparent",
        },
        isDark ? {} : Shadows.light,
      ]}
    >
      {/* ─── Hero Image with Overlay ─── */}
      {imageUrl && (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          {/* Bottom gradient for text readability */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            style={styles.imageGradient}
          />
          {/* Category badge floating on the image */}
          <View style={styles.floatingBadge}>
            <Badge
              label={t(category.label)}
              color={category.color}
              variant="solid"
            />
          </View>
          {/* One-off indicator on image */}
          {activity.type === "one_off" && (
            <View
              style={[
                styles.typeIndicator,
                {
                  backgroundColor: "rgba(0,0,0,0.45)",
                },
              ]}
            >
              <Ionicons name="calendar" size={11} color="#fff" />
              <Text style={styles.typeText}>مرة واحدة</Text>
            </View>
          )}
          {/* Time overlay on the image bottom */}
          <View style={styles.imageTimeOverlay}>
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={styles.imageTimeText}>{timeString}</Text>
          </View>
        </View>
      )}

      {/* ─── Content Section ─── */}
      <View style={styles.content}>
        {/* Category badge when no image */}
        {!imageUrl && (
          <View style={styles.inlineBadgeRow}>
            <Badge
              label={t(category.label)}
              color={category.color}
              variant="subtle"
            />
            {activity.type === "one_off" && (
              <View
                style={[
                  styles.inlineType,
                  {
                    backgroundColor: isDark
                      ? theme.primary + "20"
                      : theme.primary + "12",
                    borderColor: theme.primary + "30",
                  },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={11}
                  color={theme.primary}
                />
                <Text style={[styles.inlineTypeText, { color: theme.primary }]}>
                  مرة واحدة
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {activity.title}
        </Text>

        {/* Bottom Row: mosque + time (when no image) */}
        <View style={styles.bottomRow}>
          <View style={styles.locationRow}>
            <Text
              style={[styles.mosque, { color: theme.icon }]}
              numberOfLines={1}
            >
              {mosqueName}
            </Text>
            <LocationIcon width={18} height={18} />
          </View>
          {/* Instructor (if available) */}
          {activity.instructor && (
            <View style={styles.metaRow}>
              <Ionicons
                name="person-circle-outline"
                size={16}
                color={theme.primary}
              />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {activity.instructor}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },

  /* ─── Image ─── */
  imageWrapper: {
    height: CARD_IMAGE_HEIGHT,
    width: "100%",
    position: "relative",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: CARD_IMAGE_HEIGHT * 0.55,
  },
  floatingBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },
  typeIndicator: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: Fonts.mdsans,
  },
  imageTimeOverlay: {
    position: "absolute",
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  imageTimeText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },

  /* ─── Content ─── */
  content: {
    padding: Spacing.md,
    gap: 6,
    direction: "rtl",
  },
  inlineBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  inlineType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  inlineTypeText: {
    fontSize: 10,
    fontFamily: Fonts.mdsans,
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.bdsans,
    lineHeight: 26,
    paddingBottom: 3,

    textAlign: "left",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontFamily: Fonts.rsans,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 3,
    flexShrink: 1,
  },
  mosque: {
    fontSize: 13,
    fontFamily: Fonts.rsans,
    textAlign: "right",
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },
});
