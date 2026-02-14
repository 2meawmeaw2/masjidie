import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import {
  Colors,
  Spacing,
  BorderRadius,
  Fonts,
  Shadows,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IslamicSchool } from "@/constants/mockData";
import { Ionicons } from "@expo/vector-icons";
import LocationIcon from "@/assets/icons/location.svg";

interface IslamicSchoolCardProps {
  school: IslamicSchool;
  onPress?: () => void;
}

export function IslamicSchoolCard({ school, onPress }: IslamicSchoolCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const handlePress = () => {
    router.push(`/details/schoolInfo?id=${school.id}`);
    if (onPress) onPress();
  };

  const genderIcon =
    school.gender === "male"
      ? "male"
      : school.gender === "female"
        ? "female"
        : "people";

  const genderLabel =
    school.gender === "male"
      ? "ذكور"
      : school.gender === "female"
        ? "إناث"
        : "مختلط";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        isDark ? {} : Shadows.light,
      ]}
    >
      {/* Image */}
      <Image source={{ uri: school.imageUrl }} style={styles.image} />

      {/* Content */}
      <View style={styles.content}>
        {/* School Name */}
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {school.name}
        </Text>

        {/* City */}
        <View style={styles.row}>
          <LocationIcon width={20} height={20} />
          <Text
            style={[styles.subtitle, { color: theme.icon }]}
            numberOfLines={1}
          >
            {school.city}، {school.address}
          </Text>
        </View>

        {/* Bottom row: Programs badge + Gender + Students */}
        <View style={styles.bottomRow}>
          {/* Programs Badge */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isDark
                  ? theme.primary + "20"
                  : "rgba(27, 122, 78, 0.1)",
              },
            ]}
          >
            <Ionicons name="book-outline" size={12} color={theme.primary} />
            <Text style={[styles.badgeText, { color: theme.primary }]}>
              {school.programs.length} برامج
            </Text>
          </View>

          {/* Gender */}
          <View style={styles.metaItem}>
            <Ionicons name={genderIcon as any} size={12} color={theme.icon} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {genderLabel}
            </Text>
          </View>

          {/* Student count */}
          {school.studentCount && (
            <View style={styles.metaItem}>
              <Ionicons name="school-outline" size={12} color={theme.icon} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {school.studentCount}
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
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: Spacing.md,
    flexDirection: "row",
    direction: "ltr",
    height: 110,
  },
  image: {
    width: 100,
    height: "100%",
    backgroundColor: "#E5E7EB",
    resizeMode: "stretch",
  },
  content: {
    flex: 1,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    justifyContent: "space-between",
    direction: "rtl",
  },
  name: {
    fontSize: 15,
    fontFamily: Fonts.bdsans,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.rsans,
    flexShrink: 1,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: Fonts.mdsans,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontFamily: Fonts.rsans,
  },
});
