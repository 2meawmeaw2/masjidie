import AnimatedSettingRow from "@/components/settings/AnimatedSettingRow";
import { AnimatedHeaderBackground } from "@/components/ui/AnimatedHeaderBackground";
import { BorderRadius, Colors, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { getSavedLocation, LocationData } from "@/lib/storage";
import { PrayerName, useAdhanStore } from "@/lib/stores/adhanStore";
import { useAuthStore } from "@/lib/stores/authStore";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as StoreReview from "expo-store-review";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// REPLACE THIS with your actual Play Store package name
const GOOGLE_PLAY_ID = "com.masjidie2.app";
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_ID}`;

const PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const { t } = useTranslation();
  const { preferences: adhanPrefs } = useAdhanStore();
  const [savedCity, setSavedCity] = useState<string | null>(null);

  const enabledCount = PRAYERS.filter(
    (p) => adhanPrefs.enabledPrayers[p],
  ).length;

  useEffect(() => {
    getSavedLocation().then((data: LocationData | null) => {
      setSavedCity(data?.city ?? null);
    });
  }, []);

  // --- Handlers ---

  const onShare = async () => {
    try {
      await Share.share({
        message: `حمل تطبيق الأذان والمواقيت الرائع من هنا: ${PLAY_STORE_URL}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const onRate = async () => {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
    } else {
      Linking.openURL(PLAY_STORE_URL);
    }
  };

  const appVersion =
    Constants.expoConfig?.version ??
    Constants.manifest2?.extra?.expoClient?.version ??
    "1.0.0";

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const [isScrolled, setIsScrolled] = useState(false);

  useAnimatedReaction(
    () => scrollY.value > 50,
    (scrolled, prev) => {
      if (scrolled !== prev) {
        runOnJS(setIsScrolled)(scrolled);
      }
    },
  );

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <AnimatedHeaderBackground />

      <View
        style={{
          paddingHorizontal: Spacing.md,
        }}
      >
        {/* ─── Header ─── */}
        <Animated.View
          entering={FadeInDown.duration(300).easing(Easing.inOut(Easing.ease))}
          style={styles.headerContainer}
        >
          <Text style={[styles.header, { color: "white" }]}>
            {t("settings.title")}
          </Text>
        </Animated.View>

        {/* ─── عام (General) ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: "#ffffff" + "99" }]}>
            {t("settings.general")}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <AnimatedSettingRow
              icon="color-palette"
              title={t("settings.appearance")}
              description={t("settings.darkModeDesc")}
              index={0}
              onPress={() => router.push("/settings/appearance")}
            />
            <AnimatedSettingRow
              icon="notifications"
              title={t("adhan.title")}
              description={t("settings.adhanDesc", { count: enabledCount })}
              index={1}
              onPress={() => router.push("/settings/adhan")}
            />
            <AnimatedSettingRow
              icon="location"
              title={t("settings.location")}
              description={savedCity ? `📍 ${savedCity}` : t("settings.notSet")}
              index={2}
              isLast
              onPress={() => router.push("/settings/location")}
            />
          </View>
        </View>

        {/* ─── الدعم (Support) - NEW SECTION ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("settings.support")}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <AnimatedSettingRow
              icon="share-social-outline"
              title={t("settings.shareApp")}
              description={t("settings.shareAppDesc")}
              index={3}
              onPress={onShare}
            />
            <AnimatedSettingRow
              icon="star-outline"
              title={t("settings.rateApp")}
              description={t("settings.rateAppDesc")}
              index={4}
              isLast
              onPress={onRate}
            />
          </View>
        </View>

        {/* ─── الإدارة (Admin) ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("settings.admin")}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <AnimatedSettingRow
              icon={session ? "shield-checkmark" : "shield-outline"}
              title={
                session
                  ? t("settings.adminDashboard")
                  : t("settings.adminLogin")
              }
              index={5}
              isLast={!!session}
              onPress={() =>
                session ? router.push("/admin") : router.push("/auth/login")
              }
            />
            {!session && (
              <AnimatedSettingRow
                icon="add-circle-outline"
                title={t("settings.registerMosque")}
                index={6}
                isLast
                onPress={() => router.push("/auth/register")}
              />
            )}
          </View>
        </View>

        {/* ─── Footer ─── */}
        <Animated.Text
          entering={FadeIn.delay(350).duration(400)}
          style={[styles.versionText, { color: colors.textSecondary }]}
        >
          {t("settings.version", { version: appVersion })}
        </Animated.Text>
      </View>
    </Animated.ScrollView>
  );
}

// ... styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  content: {
    paddingBottom: 120,
  },
  headerContainer: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  header: {
    fontSize: 30,
    fontFamily: Fonts.bdsans,
    writingDirection: "rtl",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
    marginTop: Spacing.xs,
    writingDirection: "rtl",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: Fonts.sbsans,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    letterSpacing: 0.5,
    writingDirection: "rtl",
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    overflow: "hidden",
  },
  versionText: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
