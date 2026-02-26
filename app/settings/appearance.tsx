import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import AnimatedSettingRow from "@/components/settings/AnimatedSettingRow";

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
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          {t("settings.language").toUpperCase()}
        </Text>
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
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageOption,
                currentLanguage === lang && {
                  backgroundColor: colors.primary,
                  borderRadius: BorderRadius.md,
                  margin: 3,
                },
              ]}
              onPress={() => changeLanguage(lang)}
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
            </TouchableOpacity>
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
