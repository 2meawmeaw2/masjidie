import { ActivityCard } from "@/components/ActivityCard";
import { BackButton } from "@/components/ui/backButton";
import { BorderRadius, Colors, Fonts, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { handleOpenMaps } from "@/lib/location";
import { useBookmarksStore } from "@/lib/stores/bookmarksStore";
import { useEventsStore } from "@/lib/stores/eventsStore";
import { useMosquesStore } from "@/lib/stores/mosquesStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

export default function MosqueDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const { t } = useTranslation();

  // Get mosques and events from stores
  const { mosques, fetchMosques } = useMosquesStore();
  const { events, fetchEvents } = useEventsStore();
  const { isMosqueSaved, toggleMosque } = useBookmarksStore();
  const saved = isMosqueSaved(id as string);

  React.useEffect(() => {
    if (mosques.length === 0) fetchMosques();
    if (events.length === 0) fetchEvents();
  }, []);

  const mosque = mosques.find((m) => m.id === id);
  if (!mosque) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, fontFamily: Fonts.mdsans }}>
          {t("mosqueDetails.notFound")}
        </Text>
      </View>
    );
  }
  const filteredEvents = events.filter(
    (activity) => String(activity.mosqueId) === String(id),
  );
  const eventsSlice = filteredEvents.slice(0, 3);
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          headerTransparent: true,
          headerTintColor: "#fff",
        }}
      />
      <StatusBar barStyle="light-content" />
      <BackButton />

      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xl * 3 }}
      >
        {/* 1. Hero Image */}
        <View style={styles.imageContainer}>
          <Animated.Image
            source={{ uri: mosque.imageUrl }}
            style={styles.heroImage}
          />
          <View style={styles.overlay} />
        </View>

        <View
          style={[
            styles.body,
            { backgroundColor: theme.background, marginTop: -Spacing.xl },
          ]}
        >
          {/* 2. Title & Address Link */}
          <View style={styles.headerSection}>
            <Text style={[styles.mosqueName, { color: theme.tint }]}>
              {mosque.name}
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* 6. About Section */}
            <Section title={t("mosqueDetails.about")} theme={theme}>
              <Text
                style={[styles.description, { color: theme.tabIconDefault }]}
              >
                {mosque.description || t("mosqueDetails.defaultDescription")}
              </Text>
            </Section>

            <TouchableOpacity
              onPress={() => handleOpenMaps(mosque)}
              style={styles.addressLink}
            >
              <Ionicons name="location" size={18} color={theme.primary} />
              <Text
                style={[
                  styles.addressText,
                  { color: theme.primary, textDecorationLine: "underline" },
                ]}
              >
                {mosque.city}، {mosque.address} ({t("mosqueDetails.openMap")})
              </Text>
            </TouchableOpacity>

            {/* Bookmark button */}
            <TouchableOpacity
              onPress={() => {
                toggleMosque(mosque.id);
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
          </View>

          {/* 3. Capacity & Imam (Stats Grid) */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="people"
              label={t("mosqueDetails.capacity")}
              value={`${mosque.capacity ?? t("mosqueDetails.notSpecified")} ${t("mosqueDetails.worshippers")}`}
              theme={theme}
              isDark={isDark}
            />
            <StatCard
              icon="person"
              label={t("mosqueDetails.imam")}
              value={mosque.imam ?? t("mosqueDetails.notSpecified")}
              theme={theme}
              isDark={isDark}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* 4. Maraf9 (Facilities) */}
          <Section title={t("mosqueDetails.facilities")} theme={theme}>
            <View style={styles.facilitiesContainer}>
              {mosque.services?.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.facilityTag,
                    {
                      backgroundColor: isDark
                        ? theme.card
                        : theme.primary + "14",
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.primary}
                  />
                  <Text style={[styles.facilityText, { color: theme.text }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </Section>

          {/* 5. Upcoming Events (Restored) */}
          <Section title={t("mosqueDetails.upcomingEvents")} theme={theme}>
            {filteredEvents.length === 0 ? (
              <Text
                style={{ color: theme.textSecondary, fontFamily: Fonts.rsans }}
              >
                {t("mosqueDetails.noUpcomingEvents")}
              </Text>
            ) : (
              eventsSlice.map((activity, index) => (
                <ActivityCard
                  index={index}
                  key={activity.id}
                  activity={activity}
                  mosqueName={mosque?.name ?? ""}
                  imageUrl={activity?.imageUrl}
                  onPress={() => {
                    router.push(`/details/eventInfo?id=${activity.id}`);
                  }}
                />
              ))
            )}
          </Section>
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
        { backgroundColor: isDark ? theme.card : theme.background },
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
  mosqueName: {
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
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginTop: Spacing.md,
  },
  bookmarkText: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },
  // Stats Grid
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
  // Facilities
  facilitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  facilityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  facilityText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
    lineHeight: 24,
    textAlign: "left",
  },
});
