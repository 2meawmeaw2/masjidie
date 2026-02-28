import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TAB_BAR_HEIGHT = 64;
const ICON_SIZE = 24;

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          // Resolve the label
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }

            // Haptic feedback on iOS
            if (Platform.OS === "ios") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TabButton
              key={route.key}
              isFocused={isFocused}
              label={label}
              icon={options.tabBarIcon}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              onLongPress={onLongPress}
              activeColor={colors.tint}
              inactiveColor={colors.tabIconDefault}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Individual Tab Button ───────────────────────────────────────────
interface TabButtonProps {
  isFocused: boolean;
  label: string;
  icon:
    | ((props: {
        focused: boolean;
        color: string;
        size: number;
      }) => React.ReactNode)
    | undefined;
  accessibilityLabel: string;
  onPress: () => void;
  onLongPress: () => void;
  activeColor: string;
  inactiveColor: string;
}

function TabButton({
  isFocused,
  label,
  icon,
  accessibilityLabel,
  onPress,
  onLongPress,
  activeColor,
  inactiveColor,
}: TabButtonProps) {
  const scale = useSharedValue(1);
  const fontWeight = useSharedValue(isFocused ? 700 : 400);

  // Animate font weight when focus changes
  React.useEffect(() => {
    fontWeight.value = withTiming(isFocused ? 700 : 400, {
      duration: 150,
    });
  }, [isFocused, fontWeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(isFocused ? 1 : 0, { duration: 450 }) }],
  }));
  const animatedTextStyle = useAnimatedStyle(() => ({
    fontWeight: `${Math.round(fontWeight.value)}` as any,
  }));

  const color = isFocused ? activeColor : inactiveColor;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tab, animatedStyle]}
    >
      {/* Active pill indicator */}
      {isFocused && (
        <Animated.View
          style={[
            styles.activePill,
            pinAnimatedStyle,
            { backgroundColor: `${activeColor}15` },
          ]}
        />
      )}

      {/* Icon */}
      <View style={styles.iconContainer}>
        {icon?.({ focused: isFocused, color, size: ICON_SIZE })}
      </View>

      {/* Label */}
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.label,
          animatedTextStyle,
          {
            color,
            opacity: isFocused ? 1 : 0.7,
          },
        ]}
      >
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabRow: {
    flexDirection: "row",
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    position: "relative",
  },
  activePill: {
    transformOrigin: "center",
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  iconContainer: {
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
  },
});
