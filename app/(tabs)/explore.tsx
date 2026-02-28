import { ActivityCard } from "@/components/ActivityCard";
import { IslamicSchoolCard } from "@/components/IslamicSchoolCard";
import { MosqueCard } from "@/components/MosqueCard";
import { Colors, Fonts, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getDistanceKm, getPreferredLocation } from "@/lib/location";
import { useEventsStore } from "@/lib/stores/eventsStore";
import { useIslamicSchoolsStore } from "@/lib/stores/islamicSchoolsStore";
import { useMosquesStore } from "@/lib/stores/mosquesStore";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExploreScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // Stores
  const { events, isLoading: eventsLoading, fetchEvents } = useEventsStore();
  const {
    schools,
    isLoading: schoolsLoading,
    fetchSchools,
  } = useIslamicSchoolsStore();
  const { mosques, fetchMosques } = useMosquesStore();

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
        const updatedMosques = mosques.map((mosque) => ({
          ...mosque,
          distance:
            mosque.latitude && mosque.longitude
              ? getDistanceKm(
                  location.latitude,
                  location.longitude,
                  mosque.latitude,
                  mosque.longitude,
                )
              : 0,
        }));
        setMosquesWithDistance(updatedMosques);
      } else if (mosques.length > 0) {
        setMosquesWithDistance(mosques);
      }
    })();
  }, [mosques]);

  const renderFeatured = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.tint }]}>
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

  const renderIslamicSchools = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.tint }]}>
          {t("home.quranSchools")}
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

  const renderNearby = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.tint }]}>
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      {/*<AmbientBackground />*/}

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.tint }]}>
          {t("tabs.explore")}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
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
        {renderFeatured()}
        {renderIslamicSchools()}
        {renderNearby()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bdsans,
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
});
