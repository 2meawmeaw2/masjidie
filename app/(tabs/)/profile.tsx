import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/stores/authStore";
import { useAdhanStore, PrayerName } from "@/lib/stores/adhanStore";
import { getSavedLocation, LocationData } from "@/lib/storage";
import Constants from "expo-constants";
import AnimatedSettingRow from "@/components/settings/AnimatedSettingRow";

const PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuthStore();
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

  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? "1.0.0";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.Text
        entering={FadeInDown.springify().mass(0.8).damping(15).stiffness(150)}
        style={[styles.header, { color: colors.text }]}
      >
        {t("settings.title")}
      </Animated.Text>

      {/* Settings Hub */}
      <View style={styles.section}>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <AnimatedSettingRow
            icon="color-palette"
            title={t("settings.appearanceTitle")}
            description={t("settings.appearanceDesc")}
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
            title={t("settings.locationTitle")}
            description={savedCity ?? t("settings.notSet")}
            index={2}
            isLast
            onPress={() => router.push("/settings/location")}
          />
        </View>
      </View>

      {/* Admin Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t("settings.admin").toUpperCase()}
        </Text>
        <View
          style={[
            styles.sectionCard,
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
            index={3}
            isLast={!!session}
            onPress={() =>
              session ? router.push("/admin") : router.push("/auth/login")
            }
          />
          {!session && (
            <AnimatedSettingRow
              icon="add-circle-outline"
              title={t("settings.registerMosque")}
              index={4}
              isLast
              onPress={() => router.push("/auth/register")}
            />
          )}
        </View>
      </View>

      {/* Footer */}
      <Animated.Text
        entering={FadeIn.delay(400).duration(500)}
        style={[styles.versionText, { color: colors.textSecondary }]}
      >
        {t("settings.version", { version: appVersion })}
      </Animated.Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
  },
  header: {
    fontSize: 28,
    fontFamily: Fonts.bdsans,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: Fonts.mdsans,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    paddingHorizontal: Spacing.xs,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    overflow: "hidden",
  },
  versionText: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
