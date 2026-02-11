import React from "react";
import { View, Text, StyleSheet, TextInput, FlatList } from "react-native";
import { Colors, Spacing, Fonts, BorderRadius } from "@/constants/theme";
import { useTranslation } from "react-i18next";
import { MOSQUES } from "@/constants/mockData";
import { MosqueCard } from "@/components/MosqueCard";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ExploreScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("tabs.explore")}
        </Text>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.icon} />
          <TextInput
            placeholder={t("search.placeholder")}
            placeholderTextColor={theme.icon}
            style={[styles.input, { color: theme.text }]}
          />
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={MOSQUES}
          renderItem={({ item }) => (
            <MosqueCard mosque={item} onPress={() => {}} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.md }}
          ListHeaderComponent={() => (
            <View
              style={[
                styles.mapPlaceholder,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Ionicons name="map-outline" size={48} color={theme.primary} />
              <Text style={[styles.mapText, { color: theme.icon }]}>
                الخريطة ستتوفر قريباً
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bdsans,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.rsans,
    textAlign: "right", // Force right alignment for Arabic search
  },
  content: {
    flex: 1,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  mapText: {
    fontSize: 16,
    fontFamily: Fonts.mdsans,
  },
});
