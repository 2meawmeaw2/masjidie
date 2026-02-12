import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Canvas,
  LinearGradient,
  Rect,
  Image,
  useImage,
  vec,
  Mask,
  RoundedRect,
} from "@shopify/react-native-skia";
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
  index: number;
  activity: Activity;
  mosqueName: string;
  imageUrl?: string;
  onPress: () => void;
}
const imageHeight = 180;
const imageWidth = 120;
const r = 10;
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
  const image = useImage(imageUrl);
  const rrct = {
    rect: { x: 0, y: 0, width: imageWidth, height: imageHeight },
    topLeft: { x: 0, y: 0 },
    topRight: { x: 0, y: 0 },
    bottomRight: { x: 0, y: 0 },
    bottomLeft: { x: 0, y: 0 },
  };
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
      {/* Image Section with Skia Mask */}
      {imageUrl && image && (
        <View
          style={[
            styles.imageContainer,
            { transform: [{ scaleX: index === 1 ? -1 : 1 }] },
          ]}
        >
          <Canvas style={{ height: "100%" }}>
            <Mask
              mode="alpha"
              mask={
                <RoundedRect rect={rrct}>
                  <LinearGradient
                    start={vec(index === 1 ? 120 : 0, 0)}
                    end={vec(index === 1 ? 0 : 120, 0)}
                    colors={["white", Colors.light.primary + "60"]}
                  />
                </RoundedRect>
              }
            >
              <Image
                image={image}
                x={0}
                y={0}
                width={120}
                height={imageHeight}
                fit="cover"
              />
            </Mask>
          </Canvas>
        </View>
      )}

      {/* Content Section */}
      <View
        style={[
          styles.contentContainer,
          !imageUrl && { marginLeft: 0, paddingLeft: Spacing.md },
        ]}
      >
        <View style={styles.header}>
          <Badge
            label={t(category.label)}
            color={category.color}
            variant="subtle"
          />
          {activity.type === "one_off" && (
            <View
              style={[
                styles.oneOffBadge,
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
                size={12}
                color={theme.primary}
              />
              <Text style={[styles.oneOffText, { color: theme.primary }]}>
                مرة واحدة
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {activity.title}
        </Text>

        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color={theme.icon} />
          <Text style={[styles.mosque, { color: theme.icon }]}>
            {mosqueName}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.time, { color: theme.primary }]}>
            {timeString}
          </Text>
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
    flexDirection: "row", // Key: keeps image left, content right
    overflow: "hidden",
    minHeight: 120,
    direction: "ltr", // FORCE LTR to ensure Image is Left, Text is Right
  },
  imageContainer: {
    width: 120,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 10,
    overflow: "hidden",
    zIndex: 0,
  },
  contentContainer: {
    flex: 1,
    padding: Spacing.md,
    marginLeft: 100, // Offset for the blended image
    zIndex: 1,
    alignItems: "flex-end", // Align content to the right (since we forced LTR, but content is Arabic)
  },
  header: {
    flexDirection: "row-reverse", // Reverse header for Arabic content (Badge vs Star)
    justifyContent: "flex-start",
    gap: Spacing.sm,
    alignItems: "center",
    marginBottom: Spacing.sm,
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bdsans,
    marginBottom: Spacing.xs,
    textAlign: "right", // Right align Arabic text
    width: "100%",
  },
  row: {
    flexDirection: "row-reverse", // Reverse row for Arabic icon+text (Icon right, text left of it)
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.md,
    width: "100%",
  },
  mosque: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
    textAlign: "right",
  },
  footer: {
    flexDirection: "row-reverse", // Reverse footer if needed, or just align right
    alignItems: "center",
    width: "100%",
  },
  time: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
    textAlign: "right",
  },
  oneOffBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,

    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  oneOffText: {
    fontSize: 11,
    fontFamily: Fonts.mdsans,
  },
});
