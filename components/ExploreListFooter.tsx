import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Colors, Fonts, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "react-i18next";

interface Props {
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  dataLength: number;
}

export const ExploreListFooter = React.memo(function ExploreListFooter({
  isLoadingMore,
  hasMore,
  totalCount,
  dataLength,
}: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  if (isLoadingMore) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          {t("explore.loading_more")}
        </Text>
      </View>
    );
  }

  if (!hasMore && dataLength > 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          {t("explore.all_loaded_count", { count: totalCount })}
        </Text>
      </View>
    );
  }

  return null;
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  text: {
    fontSize: 13,
    fontFamily: Fonts.rsans,
  },
});
