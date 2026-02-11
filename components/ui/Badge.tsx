import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Spacing, BorderRadius, Fonts } from "@/constants/theme";

interface BadgeProps {
  label: string;
  color: string; // Background color or text color depending on variant
  variant?: "solid" | "outline" | "subtle";
  style?: ViewStyle;
}

export function Badge({ label, color, variant = "subtle", style }: BadgeProps) {
  const getStyle = () => {
    switch (variant) {
      case "solid":
        return { backgroundColor: color, borderColor: color };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: color,
          borderWidth: 1,
        };
      case "subtle":
        return { backgroundColor: `${color}20`, borderColor: "transparent" }; // 20 = 12% opacity roughly
      default:
        return {};
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "solid":
        return "#FFFFFF";
      default:
        return color;
    }
  };

  return (
    <View style={[styles.badge, getStyle(), style]}>
      <Text style={[styles.text, { color: getTextColor() }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: Fonts.medium,
  },
});
