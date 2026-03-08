import { BorderRadius, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface BackButtonProps {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  backgroundColor?: string;
  backgroundOpacityHex?: string;
  direction?: "up" | "down" | "left" | "right";
}

export function BackButton({
  top,
  bottom,
  left,
  right,
  backgroundColor,
  backgroundOpacityHex = "60",
  direction = "left", // Defaults to left for a standard back button
}: BackButtonProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const router = useRouter();

  const resolvedTop = top !== undefined ? top : 10 + insets.top;
  const resolvedRight =
    right !== undefined ? right : left !== undefined ? undefined : 10;
  const resolvedBgColor = backgroundColor || theme.tint;

  // Map the direction prop to the correct Ionicons chevron name
  const iconName = {
    up: "chevron-up",
    down: "chevron-down",
    left: "chevron-back",
    right: "chevron-forward",
  }[direction] as keyof typeof Ionicons.glyphMap;

  return (
    <TouchableOpacity
      style={{
        position: "absolute",
        top: resolvedTop,
        bottom: bottom,
        left: left,
        right: resolvedRight,
        zIndex: 1,
        backgroundColor: `${resolvedBgColor}${backgroundOpacityHex}`,
        padding: 10,
        borderRadius: BorderRadius.md,
      }}
      activeOpacity={0.7}
      onPress={() => router.back()}
    >
      <Ionicons name={iconName} size={24} color="white" />
    </TouchableOpacity>
  );
}
