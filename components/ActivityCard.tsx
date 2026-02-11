import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Colors,
  Spacing,
  BorderRadius,
  Fonts,
  Shadows,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Activity } from "@/constants/mockData";
import { CATEGORIES } from "@/constants/categories";
import { Badge } from "@/components/ui/Badge";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

interface ActivityCardProps {
  activity: Activity;
  mosqueName: string;
  onPress: () => void;
}

export function ActivityCard({
  activity,
  mosqueName,
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
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        isDark ? {} : Shadows.light,
      ]}
    >
      <View style={styles.header}>
        <Badge
          label={t(category.label)}
          color={category.color}
          variant="subtle"
        />
        {activity.type === "one_off" && (
          <Ionicons name="star" size={16} color={Colors.light.accent} />
        )}
      </View>

      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {activity.title}
      </Text>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={14} color={theme.icon} />
        <Text style={[styles.mosque, { color: theme.icon }]}>{mosqueName}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.time, { color: theme.primary }]}>
          {timeString}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bdsans,
    marginBottom: Spacing.xs,
    textAlign: "left", // Ensure alignment works with RTL
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.md,
  },
  mosque: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  time: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },
});
