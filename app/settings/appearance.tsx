import AnimatedSettingRow from "@/components/settings/AnimatedSettingRow";
import ScreenHeader from "@/components/settings/Header";
import { BorderRadius, Colors, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import i18n from "@/lib/i18n";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function AppearanceScreen() {
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChanged = (lang: string) => {
      setCurrentLanguage(lang);
    };
    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="المظهر" />

      {/* Dark Mode */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t("settings.darkMode").toUpperCase()}
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <AnimatedSettingRow
            icon="moon"
            title={t("settings.darkMode")}
            description={t("settings.darkModeDesc")}
            index={0}
            isLast
            rightElement={
              <Switch
                value={theme === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: "#767577", true: colors.primary }}
                thumbColor="#f4f3f4"
              />
            }
          />
        </View>
      </View>

      {/* Language */}
      <View style={[styles.section, { opacity: 0.6 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            {t("settings.language").toUpperCase()}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {t("settings.comingSoon", "قريباً")}
            </Text>
          </View>
        </View>
        <Animated.View
          entering={FadeInDown.delay(160)
            .springify()
            .mass(0.8)
            .damping(15)
            .stiffness(150)}
          style={[
            styles.languageContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {["en", "fr", "ar"].map((lang) => (
            <View
              key={lang}
              style={[
                styles.languageOption,
                currentLanguage === lang && {
                  backgroundColor: colors.primary,
                  borderRadius: BorderRadius.md,
                  margin: 3,
                },
              ]}
            >
              <Text
                style={[
                  styles.languageText,
                  {
                    color: currentLanguage === lang ? "#FFFFFF" : colors.text,
                  },
                ]}
              >
                {lang === "en"
                  ? "English"
                  : lang === "fr"
                    ? "Français"
                    : "العربية"}
              </Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: Fonts.mdsans,
    letterSpacing: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Fonts.mdsans,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    overflow: "hidden",
  },
  languageContainer: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    padding: 3,
  },
  languageOption: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  languageText: {
    fontFamily: Fonts.mdsans,
    fontSize: 14,
  },
});
