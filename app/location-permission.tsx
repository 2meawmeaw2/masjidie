import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { getCurrentLocation } from "@/lib/location";
import { LocationData, saveLocation } from "@/lib/storage";

export default function LocationPermissionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        // Reverse geocode via Nominatim
        const { latitude, longitude } = location.coords;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
          { headers: { "User-Agent": "MasjidieApp/1.0" } },
        );
        const geo = await res.json();
        const locationData: LocationData = {
          city: geo.address?.city || geo.address?.town || geo.address?.village,
          town: geo.address?.town,
          village: geo.address?.village,
          state: geo.address?.state,
          country: geo.address?.country,
          lat: String(latitude),
          lon: String(longitude),
          display_name: geo.display_name || "",
        };
        await saveLocation(locationData);
      }
    } catch (error) {
      console.warn("Location permission error:", error);
    } finally {
      setLoading(false);
      router.replace("/(tabs)");
    }
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  const gradientColors =
    theme === "dark"
      ? ([colors.background, "#0a1f2d", "#071a24"] as const)
      : ([colors.background, "#d4edec", "#c2e4e2"] as const);

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      {/* Icon */}
      <View style={[styles.content, { marginTop: insets.top + 80 }]}>
        <Animated.View
          entering={FadeInUp.delay(200)
            .duration(800)
            .easing(Easing.inOut(Easing.cubic))}
          style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}
        >
          <Ionicons
            name="location"
            size={64}
            color={colors.primary}
          />
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeInDown.delay(500)
            .duration(800)
            .easing(Easing.inOut(Easing.cubic))}
          style={[styles.title, { color: colors.text }]}
        >
          {t("locationPermission.title")}
        </Animated.Text>

        {/* Description */}
        <Animated.Text
          entering={FadeIn.delay(800).duration(800)}
          style={[styles.description, { color: colors.textSecondary }]}
        >
          {t("locationPermission.description")}
        </Animated.Text>
      </View>

      {/* Buttons */}
      <Animated.View
        entering={FadeInDown.delay(1100)
          .duration(800)
          .easing(Easing.out(Easing.cubic))}
        style={[
          styles.buttonWrapper,
          { paddingBottom: Math.max(insets.bottom, Spacing.xl) },
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t("locationPermission.loading")}
            </Text>
          </View>
        ) : (
          <>
            <Pressable
              onPress={handleEnable}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <Ionicons
                name="location"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.buttonText}>
                {t("locationPermission.enable")}
              </Text>
            </Pressable>

            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                {t("locationPermission.skip")}
              </Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bdsans,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 16,
    fontFamily: Fonts.rsans,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  buttonWrapper: {
    paddingHorizontal: Spacing.lg,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: Fonts.sbsans,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  skipText: {
    fontSize: 15,
    fontFamily: Fonts.rsans,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: Fonts.rsans,
  },
});
