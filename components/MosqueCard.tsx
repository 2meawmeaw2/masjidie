import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import {
  Colors,
  Spacing,
  BorderRadius,
  Fonts,
  Shadows,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Mosque } from "@/constants/mockData";
import { Ionicons } from "@expo/vector-icons";

interface MosqueCardProps {
  mosque: Mosque;
  onPress: () => void;
}

export function MosqueCard({ mosque, onPress }: MosqueCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        isDark ? {} : Shadows.light,
      ]}
    >
      <Image source={{ uri: mosque.imageUrl }} style={styles.image} />

      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {mosque.name}
        </Text>

        <View style={styles.row}>
          <Ionicons name="location-sharp" size={14} color={theme.icon} />
          <Text
            style={[styles.address, { color: theme.icon }]}
            numberOfLines={1}
          >
            {mosque.city}
          </Text>
        </View>

        <View style={styles.badge}>
          <Text style={[styles.distance, { color: theme.primary }]}>
            {mosque.distance} كم
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: Spacing.md,
    flexDirection: "row",
    height: 100, // Fixed height for list consistency
  },
  image: {
    width: 100,
    height: "100%",
    backgroundColor: "#E5E7EB",
  },
  content: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontFamily: Fonts.bdsans,
    textAlign: "left",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  address: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(27, 122, 78, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distance: {
    fontSize: 12,
    fontFamily: Fonts.mdsans,
  },
});
