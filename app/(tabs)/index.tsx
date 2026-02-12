import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Colors, Spacing, Fonts, BorderRadius } from "@/constants/theme";
import { useTranslation } from "react-i18next";
import { CATEGORIES, CategoryId } from "@/constants/categories";
import { MOSQUES, ACTIVITIES } from "@/constants/mockData";
import { ActivityCard } from "@/components/ActivityCard";
import { MosqueCard } from "@/components/MosqueCard";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "@/components/ui/Badge";
import Logo from "@/assets/logo.svg";

export default function HomeScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View>
        <Text style={[styles.appName, { color: theme.primary }]}>
          {t("app_name")}
        </Text>
      </View>
      <Logo width={40} height={40} />
    </View>
  );

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
              {/* @ts-ignore */}
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

  const renderFeatured = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t("home.featured")}
        </Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: theme.primary }]}>
            {t("common.view_all")}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: Spacing.md }}>
        {ACTIVITIES.slice(0, 3).map((activity, index) => {
          const mosque = MOSQUES.find((m) => m.id === activity.mosqueId);
          return (
            <ActivityCard
              index={index}
              key={activity.id}
              activity={activity}
              mosqueName={mosque?.name ?? ""}
              imageUrl={activity?.imageUrl}
              onPress={() => {}}
            />
          );
        })}
      </View>
    </View>
  );

  const renderNearby = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t("home.nearby")}
        </Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: theme.primary }]}>
            {t("common.view_all")}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: Spacing.md }}>
        {MOSQUES.slice(0, 3).map((mosque) => (
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {renderHeader()}
        {renderCategories()}
        {renderFeatured()}
        {renderNearby()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
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
