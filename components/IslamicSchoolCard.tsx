import React, { useCallback } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import LocationIcon from "@/assets/icons/location.svg";
import { IslamicSchool } from "@/constants/mockData";
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
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const IMAGE_HEIGHT = 150;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING_CONFIG = { damping: 18, stiffness: 220, mass: 0.4 };

interface IslamicSchoolCardProps {
  school: IslamicSchool;
  onPress?: () => void;
}

export const IslamicSchoolCard = React.memo(function IslamicSchoolCard({
  school,
  onPress,
}: IslamicSchoolCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, SPRING_CONFIG);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  const handlePress = useCallback(() => {
    router.push(`/details/schoolInfo?id=${school.id}`);
    onPress?.();
  }, [school.id, onPress, router]);

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
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.card },
        isDark ? Shadows.dark : Shadows.light,
        animatedStyle,
      ]}
    >
      {/* Hero Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: school.imageUrl }}
          style={StyleSheet.absoluteFill}
        />

        {/* Gradient overlay for readability */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.65)"]}
          locations={[0.3, 1]}
          style={styles.bottomGradient}
        />

        {/* Gender badge — top left */}
        <View style={styles.genderBadge}>
          <Ionicons name={genderIcon as any} size={12} color="#FFF" />
          <Text style={styles.genderBadgeText}>{genderLabel}</Text>
        </View>

        {/* School name overlaid on image bottom */}
        <View style={styles.imageFooter}>
          <Text style={styles.heroName} numberOfLines={1}>
            {school.name}
          </Text>
          <View style={styles.locationRow}>
            <Text style={styles.heroCity} numberOfLines={1}>
              {school.city}، {school.address}
            </Text>
            <LocationIcon
              width={12}
              height={12}
              fill="rgba(255,255,255,0.75)"
            />
          </View>
        </View>
      </View>

      {/* Info Strip */}
      <View
        style={[
          styles.infoStrip,
          {
            borderTopColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.05)",
          },
        ]}
      >
        {/* Programs pill */}
        <View
          style={[styles.infoPill, { backgroundColor: theme.primary + "18" }]}
        >
          <Ionicons name="book-outline" size={13} color={theme.primary} />
          <Text style={[styles.infoPillText, { color: theme.primary }]}>
            {school.programs.length} برامج
          </Text>
        </View>

        {/* Gold accent divider */}
        <View style={styles.accentDivider}>
          <View
            style={[
              styles.divLine,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.08)",
              },
            ]}
          />
          <Ionicons
            name="star"
            size={7}
            color={theme.accent}
            style={{ marginHorizontal: 5, opacity: 0.7 }}
          />
          <View
            style={[
              styles.divLine,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.08)",
              },
            ]}
          />
        </View>

        {/* Student count */}
        {school.studentCount ? (
          <View style={styles.metaItem}>
            <Ionicons
              name="school-outline"
              size={13}
              color={theme.textSecondary}
            />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {school.studentCount} طالب
            </Text>
          </View>
        ) : (
          <Ionicons
            name="chevron-back"
            size={16}
            color={theme.textSecondary}
            style={{ opacity: 0.5 }}
          />
        )}
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },

  // Image area
  imageContainer: {
    width: "100%",
    height: IMAGE_HEIGHT,
    backgroundColor: "#1a1a1a",
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: IMAGE_HEIGHT * 0.65,
  },
  genderBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  genderBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: Fonts.mdsans,
  },
  imageFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm + 2,
    alignItems: "flex-start",
  },
  heroName: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: Fonts.bdsans,
    textAlign: "right",
    marginBottom: 2,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroCity: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontFamily: Fonts.rsans,
    textAlign: "right",
  },

  // Info strip
  infoStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  infoPillText: {
    fontSize: 12,
    fontFamily: Fonts.mdsans,
  },
  accentDivider: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  divLine: {
    flex: 1,
    height: 1,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
  },
});
