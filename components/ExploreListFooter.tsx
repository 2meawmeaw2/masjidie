import { BorderRadius, Colors, Fonts, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  dataLength: number;
  onLoadMore?: () => void;
}

export const ExploreListFooter = React.memo(function ExploreListFooter({
  isLoadingMore,
  hasMore,
  totalCount,
  dataLength,
  onLoadMore,
}: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

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

  if (hasMore && dataLength > 0) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={onLoadMore}
          activeOpacity={0.8}
          style={[
            styles.loadMoreButton,
            {
              backgroundColor: isDark
                ? theme.primary + "18"
                : theme.primary + "10",
              borderColor: theme.primary + "40",
            },
          ]}
        >
          <Ionicons
            name="chevron-down-outline"
            size={18}
            color={theme.primary}
          />
          <Text style={[styles.loadMoreText, { color: theme.primary }]}>
            {t("explore.load_more", { defaultValue: "تحميل المزيد" })}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.countText, { color: theme.textSecondary }]}>
          {t("explore.showing_count", {
            current: dataLength,
            total: totalCount,
            defaultValue: `${dataLength} / ${totalCount}`,
          })}
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
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  text: {
    fontSize: 13,
    fontFamily: Fonts.rsans,
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  loadMoreText: {
    fontSize: 15,
    fontFamily: Fonts.mdsans,
  },
  countText: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
    marginTop: 2,
  },
});
