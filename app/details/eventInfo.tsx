import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ACTIVITIES, MOSQUES } from "@/constants/mockData";
import { CATEGORIES } from "@/constants/categories";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";
import { handleOpenMaps } from "@/lib/location";

export default function EventDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const activity = ACTIVITIES.find((a) => a.id === id);
  const mosque = activity
    ? MOSQUES.find((m) => m.id === activity.mosqueId)
    : undefined;
  const category = activity ? CATEGORIES[activity.categoryId] : null;

  if (!activity || !category) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, fontFamily: Fonts.mdsans }}>
          الحدث غير موجود
        </Text>
      </View>
    );
  }

  const getDayName = (dayIndex?: number) => {
    const days = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    return days[dayIndex ?? 0];
  };

  const formattedDate =
    activity.type === "recurring"
      ? `كل ${getDayName(activity.dayOfWeek)}`
      : activity.date;

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
          <Image source={{ uri: activity.imageUrl }} style={styles.heroImage} />
          <View style={styles.overlay} />
        </View>

        <View
          style={[
            styles.body,
            { backgroundColor: theme.background, marginTop: -Spacing.xl },
          ]}
        >
          {/* 2. Title & Mosque Link */}
          <View style={styles.headerSection}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginBottom: Spacing.xs,
              }}
            >
              <Text
                style={[
                  styles.eventTitleMain,
                  { color: theme.tint, flex: 1, marginBottom: 0 },
                ]}
              >
                {activity.title}
              </Text>
              <Badge
                label={t(category.label)}
                color={category.color}
                variant="subtle"
              />
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Description Section */}
            <Section title="تفاصيل الحدث" theme={theme}>
              <Text
                style={[styles.description, { color: theme.tabIconDefault }]}
              >
                {activity.description}
              </Text>
            </Section>

            {mosque && (
              <TouchableOpacity
                onPress={() => handleOpenMaps(mosque)}
                style={styles.mosqueLink}
              >
                <Ionicons name="location" size={18} color={theme.primary} />
                <Text
                  style={[
                    styles.mosqueLinkText,
                    { color: theme.primary, textDecorationLine: "underline" },
                  ]}
                >
                  {mosque.name} - {mosque.city} (اضغط للتفاصيل)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 3. Info Grid */}
          <View style={styles.statsGrid}>
            {activity.instructor && (
              <StatCard
                icon="person"
                label="المحاضر"
                value={activity.instructor}
                theme={theme}
                isDark={isDark}
              />
            )}
            <StatCard
              icon="calendar"
              label="التوقيت"
              value={`${formattedDate} | ${activity.startTime}`}
              theme={theme}
              isDark={isDark}
            />
          </View>
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
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  body: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  // Header Section
  headerSection: {
    marginBottom: Spacing.lg,
    alignItems: "flex-start",
  },
  eventTitleMain: {
    fontSize: 26,
    fontFamily: Fonts.bdsans,
    marginBottom: Spacing.xs,
    textAlign: "left",
  },
  mosqueLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    marginTop: Spacing.md,
  },
  mosqueLinkText: {
    fontSize: 15,
    fontFamily: Fonts.mdsans,
  },
  // Stats Grid
  statsGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
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
  // Section Shared
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
});
