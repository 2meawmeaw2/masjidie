import { AddToScheduleSheet } from "@/components/AddToScheduleSheet";
import { Badge } from "@/components/ui/Badge";
import { CATEGORIES } from "@/constants/categories";
import { BorderRadius, Colors, Fonts, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { handleOpenMaps } from "@/lib/location";
import { useEventsStore } from "@/lib/stores/eventsStore";
import { useMosquesStore } from "@/lib/stores/mosquesStore";
import { useScheduleStore } from "@/lib/stores/scheduleStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EventDetails() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { events, fetchEvents, isLoading } = useEventsStore();
  const isEventSaved = useScheduleStore((s) => s.isEventSaved);
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    if (events.length === 0) {
      fetchEvents();
    }
  }, [events.length, fetchEvents]);

  const { mosques } = useMosquesStore();

  const activity = events.find((a) => a.id === id);
  console.log(activity, "activity");
  const mosque = activity
    ? mosques.find((m) => m.id === activity.mosqueId)
    : undefined;
  const category = activity ? CATEGORIES[activity.categoryId] : null;

  if (isLoading && !activity) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

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
          headerShown: false,
        }}
      />
      <StatusBar barStyle="light-content" />
      <TouchableOpacity
        style={{
          position: "absolute",
          right: 10,
          top: 10 + insets.top,
          zIndex: 1,
          backgroundColor: theme.tint + "60",
          padding: 10,
          borderRadius: BorderRadius.md,
        }}
        activeOpacity={0.7}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
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

            {mosque ? (
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
            ) : activity.mosqueName ? (
              <View style={styles.mosqueLink}>
                <Ionicons name="location" size={18} color={theme.primary} />
                <Text style={[styles.mosqueLinkText, { color: theme.primary }]}>
                  {activity.mosqueName}
                  {activity.mosqueCity ? ` - ${activity.mosqueCity}` : ""}
                </Text>
              </View>
            ) : null}
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

          {/* Save to schedule */}
          {(activity.type === "recurring" || activity.type === "one_off") && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (isEventSaved(activity.id)) {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Warning,
                  );
                  return;
                }
                setSheetVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: isEventSaved(activity.id)
                    ? theme.primary + "18"
                    : theme.primary,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Ionicons
                name={
                  isEventSaved(activity.id)
                    ? "checkmark-circle"
                    : "bookmark-outline"
                }
                size={20}
                color={isEventSaved(activity.id) ? theme.primary : "#fff"}
              />
              <Text
                style={[
                  styles.saveBtnText,
                  {
                    color: isEventSaved(activity.id) ? theme.primary : "#fff",
                  },
                ]}
              >
                {isEventSaved(activity.id)
                  ? "تم الحفظ في الجدول"
                  : "حفظ في الجدول"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Schedule Sheet */}
      <AddToScheduleSheet
        visible={sheetVisible}
        activity={activity}
        onClose={() => setSheetVisible(false)}
      />
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
  // Save to schedule button
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginTop: Spacing.lg,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: Fonts.bdsans,
  },
});
