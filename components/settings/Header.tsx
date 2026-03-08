import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { BackButton } from "../ui/backButton";

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightElement?: React.ReactNode;
  containerStyle?: ViewStyle;
  onBackPress?: () => void;
}

export default function ScreenHeader({
  title,
  showBackButton = true,
  rightElement,
  containerStyle,
  onBackPress,
}: ScreenHeaderProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).easing(Easing.out(Easing.quad))}
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.sm,
          backgroundColor: colors.background,
        },
        containerStyle,
      ]}
    >
      <BackButton direction="right" left={10} backgroundOpacityHex="99" />

      <View style={styles.content}>
        {/* Right Side (Actions) */}
        {/*
        Icon prop for each section
        <View style={styles.sideContainer}>{rightElement}</View>
        */}

        {/* Center/Title */}
        <Text numberOfLines={1} style={[styles.title, { color: colors.tint }]}>
          {title}
        </Text>

        {/* Left Side (Back Button) */}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  content: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.bdsans, // Matches your header font
    textAlign: "center",
    flex: 1,
  },
  sideContainer: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
