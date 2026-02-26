import Logo from "@/assets/logo.svg";
import { ActivityCard } from "@/components/ActivityCard";
import { IslamicSchoolCard } from "@/components/IslamicSchoolCard";
import { MosqueCard } from "@/components/MosqueCard";
import { CATEGORIES, CategoryId } from "@/constants/categories";
import { BorderRadius, Colors, Fonts, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { calculateDistance, getPreferredLocation } from "@/lib/location";
import { useEventsStore } from "@/lib/stores/eventsStore";
import { useIslamicSchoolsStore } from "@/lib/stores/islamicSchoolsStore";
import { useMosquesStore } from "@/lib/stores/mosquesStore";
import { Ionicons } from "@expo/vector-icons";
import * as NavigationBar from "expo-navigation-bar";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Import our new Pro component
import { AmbientBackground } from "@/components/ui/ambientBG";

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets(); // Get safe area dimensions

  // Stores
  const { events, isLoading: eventsLoading, fetchEvents } = useEventsStore();
  const {
    schools,
    isLoading: schoolsLoading,
    fetchSchools,
  } = useIslamicSchoolsStore();
  const {
    mosques,
    isLoading: mosquesLoading,
    fetchMosques,
  } = useMosquesStore();

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return t("home.greeting_night", "طاب مساؤكم");
    if (hour < 12) return t("home.greeting_morning", "صباح الخير");
    if (hour < 17) return t("home.greeting_afternoon", "طاب يومكم");
    return t("home.greeting_evening", "مساء الخير");
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { marginTop: insets.top }]}>
      <View>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>
          {getGreeting()}
        </Text>
        <Text style={[styles.appName, { color: theme.primary }]}>
          {t("app_name")}
        </Text>
      </View>
      <Logo width={50} height={50} />
    </View>
  );

  // ... [Keep renderCategories exactly as you had it] ...
  const renderCategories = () => (
    <View style={styles.sectionContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.md,
          gap: Spacing.sm,
        }}
        data={
          Object.entries(CATEGORIES) as [
            CategoryId,
            (typeof CATEGORIES)[CategoryId],
          ][]
        }
        renderItem={({ item: [id, cat] }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${cat.color}20` },
              ]}
            >
              <Ionicons name={cat.icon as any} size={18} color={cat.color} />
            </View>
            <Text style={[styles.categoryLabel, { color: theme.text }]}>
              {t(cat.label)}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={([id]) => id}
      />
    </View>
  );
  // ... [Keep renderFeatured exactly as you had it] ...
  const renderFeatured = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t("home.featured")}
        </Text>
      </View>
      <View style={{ paddingHorizontal: Spacing.md }}>
        {eventsLoading && events.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginVertical: Spacing.lg }}
          />
        ) : (
          events.slice(0, 3).map((activity, index) => {
            const mosque = mosques.find((m) => m.id === activity.mosqueId);
            return (
              <ActivityCard
                index={index}
                key={activity.id}
                activity={activity}
                mosqueName={mosque?.name ?? activity.mosqueName ?? ""}
                imageUrl={activity?.imageUrl}
                onPress={() => {
                  router.push(`/details/eventInfo?id=${activity.id}`);
                }}
              />
            );
          })
        )}
      </View>
    </View>
  );

  const [mosquesWithDistance, setMosquesWithDistance] = React.useState(mosques);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchEvents(), fetchSchools(), fetchMosques()]);
    setRefreshing(false);
  }, [fetchEvents, fetchSchools, fetchMosques]);

  useFocusEffect(
    React.useCallback(() => {
      fetchEvents();
      fetchSchools();
      fetchMosques();
    }, []),
  );

  // Recalculate distances when mosques data changes
  React.useEffect(() => {
    (async () => {
      const location = await getPreferredLocation();
      if (location && mosques.length > 0) {
        const updatedMosques = mosques.map((mosque) => {
          const dist = calculateDistance(
            location.latitude,
            location.longitude,
            mosque.latitude,
            mosque.longitude,
          );
          return { ...mosque, distance: dist };
        });
        setMosquesWithDistance(updatedMosques);
      } else if (mosques.length > 0) {
        setMosquesWithDistance(mosques);
      }
    })();
  }, [mosques]);
  const renderIslamicSchools = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          المدارس القرآنية
        </Text>
      </View>
      <View style={{ paddingHorizontal: Spacing.md }}>
        {schoolsLoading && schools.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginVertical: Spacing.lg }}
          />
        ) : (
          schools
            .slice(0, 3)
            .map((school) => (
              <IslamicSchoolCard key={school.id} school={school} />
            ))
        )}
      </View>
    </View>
  );

  // ... [Keep renderNearby exactly as you had it] ...
  const renderNearby = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t("home.nearby")}
        </Text>
      </View>
      <View style={{ paddingHorizontal: Spacing.md }}>
        {mosquesWithDistance.slice(0, 3).map((mosque) => (
          <MosqueCard key={mosque.id} mosque={mosque} onPress={() => {}} />
        ))}
      </View>
    </View>
  );

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("transparent");
    NavigationBar.setPositionAsync("absolute");
  }, []);
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
      />

      {/* 1. BACKGROUND LAYER 
        This sits behind everything, edge-to-edge.
      */}
      <AmbientBackground />

      {/* 2. CONTENT LAYER 
        We use ScrollView directly, adding padding for the bottom tab bar.
      */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingTop: Spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {renderHeader()}
        {renderCategories()}
        {renderFeatured()}
        {renderIslamicSchools()}
        {renderNearby()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color is handled by Skia now, but keep a fallback
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    // Note: marginTop is handled inline using safe area insets
  },
  greeting: {
    fontSize: 16,
    fontFamily: Fonts.rsans,
    opacity: 0.8,
  },
  appName: {
    fontSize: 24,
    fontFamily: Fonts.bdsans,
  },
  // ... [Keep the rest of your styles exactly as they were] ...
  notificationBtn: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  sectionContainer: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    textAlign: "right",
    fontSize: 18,
    fontFamily: Fonts.bdsans,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    paddingRight: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  iconContainer: {
    padding: 6,
    borderRadius: BorderRadius.full,
  },
  categoryLabel: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },
});
