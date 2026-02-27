import LocationIcon from "@/assets/icons/location.svg";
import { Mosque } from "@/constants/mockData";
import {
  BorderRadius,
  Colors,
  Fonts,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBookmarksStore } from "@/lib/stores/bookmarksStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.88;
const IMAGE_HEIGHT = 220;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 18, stiffness: 220, mass: 0.4 };

interface MosqueCardProps {
  mosque: Mosque;
  onPress?: () => void;
}

export const MosqueCard = React.memo(function MosqueCard({
  mosque,
  onPress,
}: MosqueCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const { isMosqueSaved, toggleMosque } = useBookmarksStore();
  const saved = isMosqueSaved(mosque.id);

  const handleBookmark = useCallback(() => {
    toggleMosque(mosque.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [mosque.id, toggleMosque]);

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => (scale.value = withSpring(0.97, SPRING_CONFIG));
  const handlePressOut = () => (scale.value = withSpring(1, SPRING_CONFIG));

  const handlePress = useCallback(() => {
    router.push(`/details/mosqueInfo?id=${mosque.id}`);
    onPress?.();
  }, [mosque.id, onPress, router]);
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
      {/* ── Hero Image ── */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: mosque.imageUrl }}
          style={StyleSheet.absoluteFill}
        />

        {/* Bottom-up gradient overlay — ensures text is readable */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.72)"]}
          locations={[0.35, 1]}
          style={styles.bottomGradient}
        />

        {/* Top-left bookmark */}
        <Pressable
          onPress={handleBookmark}
          style={[
            styles.bookmarkBtn,
            { backgroundColor: saved ? theme.primary : "rgba(0,0,0,0.35)" },
          ]}
          hitSlop={8}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={18}
            color="#FFF"
          />
        </Pressable>

        {/* Distance badge — top right */}
        {mosque.distance !== undefined && (
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate" size={11} color="#FFF" />
            <Text style={styles.distanceText}>{mosque.distance} كم</Text>
          </View>
        )}

        {/* Name + city overlaid on image bottom */}
        <View style={styles.imageFooter}>
          <Text style={styles.heroName} numberOfLines={1}>
            {mosque.name}
          </Text>
          <View style={styles.locationRow}>
            <Text style={styles.heroCity} numberOfLines={1}>
              {mosque.city} - {mosque.address}
            </Text>
            <LocationIcon
              width={13}
              height={13}
              fill="rgba(255,255,255,0.75)"
            />
          </View>
        </View>
      </View>

      {/* ── Info Strip ── */}
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
        {/* Explore pill */}
        <View
          style={[
            styles.explorePill,
            { backgroundColor: theme.primary + "18" },
          ]}
        >
          <Ionicons name="compass-outline" size={14} color={theme.primary} />
          <Text style={[styles.exploreText, { color: theme.primary }]}>
            استكشاف
          </Text>
        </View>

        {/* Decorative Islamic star divider */}
        <View style={styles.starDivider}>
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
            size={8}
            color={theme.primary}
            style={{ marginHorizontal: 6, opacity: 0.6 }}
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

        {/* Chevron */}
        <Ionicons
          name="chevron-back"
          size={18}
          color={theme.textSecondary}
          style={{ opacity: 0.5 }}
        />
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    alignSelf: "center",
  },

  // ── Image area ──
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
  bookmarkBtn: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  distanceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  distanceText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: Fonts.mdsans,
  },
  imageFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    alignItems: "flex-start", // RTL — right-align text
  },
  heroName: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: Fonts.bdsans,
    textAlign: "right",
    marginBottom: 4,
    // Subtle text shadow for legibility
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroCity: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontFamily: Fonts.rsans,
    textAlign: "right",
  },

  // ── Info strip ──
  infoStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  explorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  exploreText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },
  starDivider: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  divLine: {
    flex: 1,
    height: 1,
  },
});
