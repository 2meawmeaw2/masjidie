import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useIslamicSchoolsStore } from "@/lib/stores/islamicSchoolsStore";
import { useBookmarksStore } from "@/lib/stores/bookmarksStore";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

export default function SchoolDetails() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const { t } = useTranslation();
  const { getSchoolById, fetchSchools, isLoading } = useIslamicSchoolsStore();
  const { isSchoolSaved, toggleSchool } = useBookmarksStore();

  useEffect(() => {
    fetchSchools();
  }, []);

  const school = getSchoolById(id as string);

  if (isLoading && !school) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!school) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, fontFamily: Fonts.mdsans }}>
          المدرسة غير موجودة
        </Text>
      </View>
    );
  }

  const genderLabel =
    school.gender === "male"
      ? "ذكور"
      : school.gender === "female"
        ? "إناث"
        : "مختلط";

  const genderIcon =
    school.gender === "male"
      ? "male"
      : school.gender === "female"
        ? "female"
        : "people";

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerTintColor: "#fff",
        }}
      />
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xl * 3 }}
      >
        {/* 1. Hero Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: school.imageUrl }} style={styles.heroImage} />
          <View style={styles.overlay} />
        </View>

        <View
          style={[
            styles.body,
            { backgroundColor: theme.background, marginTop: -Spacing.xl },
          ]}
        >
          {/* 2. School name + Address */}
          <View style={styles.headerSection}>
            <Text style={[styles.schoolName, { color: theme.tint }]}>
              {school.name}
            </Text>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Description */}
            <Section title="نبذة عن المدرسة" theme={theme}>
              <Text
                style={[styles.description, { color: theme.tabIconDefault }]}
              >
                {school.description}
              </Text>
            </Section>

            {/* Address link */}
            {school.mapsUrl && (
              <TouchableOpacity
                onPress={() => Linking.openURL(school.mapsUrl!)}
                style={styles.addressLink}
              >
                <Ionicons name="location" size={18} color={theme.primary} />
                <Text
                  style={[
                    styles.addressText,
                    { color: theme.primary, textDecorationLine: "underline" },
                  ]}
                >
                  {school.city}، {school.address} (اضغط للخريطة)
                </Text>
              </TouchableOpacity>
            )}

            {/* Bookmark button */}
            {(() => {
              const saved = isSchoolSaved(school.id);
              return (
                <TouchableOpacity
                  onPress={() => {
                    toggleSchool(school.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.bookmarkButton,
                    {
                      backgroundColor: saved ? theme.primary : "transparent",
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name={saved ? "bookmark" : "bookmark-outline"}
                    size={18}
                    color={saved ? "#fff" : theme.primary}
                  />
                  <Text
                    style={[
                      styles.bookmarkText,
                      { color: saved ? "#fff" : theme.primary },
                    ]}
                  >
                    {saved ? t("bookmarks.saved") : t("bookmarks.save")}
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </View>

          {/* 3. Stats Grid */}
          <View style={styles.statsGrid}>
            {school.studentCount && (
              <StatCard
                icon="school"
                label="عدد الطلاب"
                value={`${school.studentCount} طالب`}
                theme={theme}
                isDark={isDark}
              />
            )}
            {school.founded && (
              <StatCard
                icon="calendar"
                label="سنة التأسيس"
                value={school.founded}
                theme={theme}
                isDark={isDark}
              />
            )}
            {school.ageRange && (
              <StatCard
                icon="body"
                label="الفئة العمرية"
                value={school.ageRange}
                theme={theme}
                isDark={isDark}
              />
            )}
            <StatCard
              icon={genderIcon}
              label="الجنس"
              value={genderLabel}
              theme={theme}
              isDark={isDark}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* 4. Programs */}
          <Section title="البرامج المقدمة" theme={theme}>
            <View style={styles.programsContainer}>
              {school.programs.map((program, index) => (
                <View
                  key={index}
                  style={[
                    styles.programTag,
                    {
                      backgroundColor: isDark
                        ? theme.card
                        : "rgba(27, 122, 78, 0.08)",
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.primary}
                  />
                  <Text style={[styles.programText, { color: theme.text }]}>
                    {program}
                  </Text>
                </View>
              ))}
            </View>
          </Section>

          {/* 5. Contact Info */}
          {(school.phone || school.email || school.website) && (
            <Section title="معلومات التواصل" theme={theme}>
              <View style={styles.contactContainer}>
                {school.phone && (
                  <ContactRow
                    icon="call-outline"
                    value={school.phone}
                    theme={theme}
                    isDark={isDark}
                    onPress={() => Linking.openURL(`tel:${school.phone}`)}
                  />
                )}
                {school.email && (
                  <ContactRow
                    icon="mail-outline"
                    value={school.email}
                    theme={theme}
                    isDark={isDark}
                    onPress={() => Linking.openURL(`mailto:${school.email}`)}
                  />
                )}
                {school.website && (
                  <ContactRow
                    icon="globe-outline"
                    value={school.website.replace("https://", "")}
                    theme={theme}
                    isDark={isDark}
                    onPress={() => Linking.openURL(school.website!)}
                  />
                )}
              </View>
            </Section>
          )}
        </View>
      </ScrollView>
    </>
  );
}

// --- Sub Components ---

const StatCard = ({ icon, label, value, theme, isDark }: any) => (
  <View
    style={[
      styles.statCard,
      { backgroundColor: theme.card, borderColor: theme.border },
    ]}
  >
    <View
      style={[
        styles.iconCircle,
        { backgroundColor: isDark ? "#333" : "#f2f2f2" },
      ]}
    >
      <Ionicons name={icon} size={22} color={theme.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  </View>
);

const ContactRow = ({ icon, value, theme, isDark, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.contactRow,
      { backgroundColor: theme.card, borderColor: theme.border },
    ]}
  >
    <View
      style={[
        styles.contactIcon,
        { backgroundColor: isDark ? "#333" : "rgba(27, 122, 78, 0.08)" },
      ]}
    >
      <Ionicons name={icon} size={18} color={theme.primary} />
    </View>
    <Text
      style={[styles.contactText, { color: theme.primary }]}
      numberOfLines={1}
    >
      {value}
    </Text>
    <Ionicons name="chevron-back" size={16} color={theme.icon} />
  </TouchableOpacity>
);

const Section = ({ title, children, theme }: any) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    {children}
  </View>
);

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    direction: "rtl",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    height: 280,
    width: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "stretch",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  body: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  // Header
  headerSection: {
    marginBottom: Spacing.lg,
    alignItems: "flex-start",
  },
  schoolName: {
    fontSize: 26,
    fontFamily: Fonts.bdsans,
    marginBottom: Spacing.xs,
    textAlign: "left",
  },
  addressLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  addressText: {
    fontSize: 15,
    fontFamily: Fonts.mdsans,
  },
  bookmarkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginTop: Spacing.md,
  },
  bookmarkText: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },
  // Stats
  statsGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
    textAlign: "left",
  },
  statValue: {
    fontSize: 14,
    fontFamily: Fonts.bdsans,
    textAlign: "left",
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: Spacing.md,
  },
  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bdsans,
    marginBottom: Spacing.md,
    textAlign: "left",
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
    lineHeight: 24,
    textAlign: "left",
  },
  // Programs
  programsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  programTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  programText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },
  // Contact
  contactContainer: {
    gap: Spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.mdsans,
    textAlign: "left",
  },
});
