import { SmoothAnimations } from "@/constants/animations";
import { BorderRadius, Colors, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedSettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  index: number;
  isLast?: boolean;
}

export default function AnimatedSettingRow({
  icon,
  title,
  description,
  rightElement,
  onPress,
  index,
  isLast,
}: AnimatedSettingRowProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      // withTiming provides a predictable, smooth transition
      scale.value = withTiming(0.97, {
        duration: 150,
        easing: SmoothAnimations.interactive,
      });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withTiming(1, {
        duration: 150,
        easing: SmoothAnimations.interactive,
      });
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80)
        .duration(400) // Replaced .springify() with a fixed duration
        .easing(SmoothAnimations.entering)}
    >
      <AnimatedPressable
        style={[
          animatedStyle,
          styles.row,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress && !rightElement}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: colors.background }]}
        >
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {description}
            </Text>
          ) : null}
        </View>
        {rightElement ??
          (onPress ? (
            <Ionicons
              name="chevron-back"
              size={18}
              color={colors.textSecondary}
            />
          ) : null)}
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md - 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm + 2,
    justifyContent: "center",
    alignItems: "center",
    marginEnd: Spacing.sm + 4,
  },
  textContainer: {
    flex: 1,
    paddingEnd: 10,
  },
  title: {
    fontSize: 15,
    fontFamily: Fonts.mdsans,
  },
  description: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
    marginTop: 2,
  },
});
