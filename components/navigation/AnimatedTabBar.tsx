import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
  Platform,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
  useDerivedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  Colors,
  Spacing,
  BorderRadius,
  Fonts,
  Shadows,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

// SVG Imports
import HomeIcon from "../../assets/icons/home.svg";
import CompassIcon from "../../assets/icons/compass.svg";
import CalendarIcon from "../../assets/icons/calendar.svg";
import ProfileIcon from "../../assets/icons/profile.svg";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [tabBarWidth, setTabBarWidth] = useState(0);

  const totalTabs = state.routes.length;
  const tabWidth = tabBarWidth / totalTabs;

  const translateX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0) {
      translateX.value = withSpring(state.index * tabWidth, {
        mass: 0.8,
        damping: 15,
        stiffness: 150,
      });
    }
  }, [state.index, tabWidth]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setTabBarWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 20,
          paddingBottom: Spacing.xs,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      ]}
      onLayout={handleLayout}
    >
      <View style={styles.contentContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              if (Platform.OS === "ios") {
                Haptics.selectionAsync();
              }
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const IconComponent = getIconComponent(route.name);

          return (
            <TabButton
              key={route.key}
              isFocused={isFocused}
              label={label as string}
              routeName={route.name}
              IconComponent={IconComponent}
              onPress={onPress}
              onLongPress={onLongPress}
              activeColor={colors.tint}
              inactiveColor={colors.tabIconDefault}
              labelStyle={
                isFocused
                  ? { fontFamily: Fonts.bdsans }
                  : { fontFamily: Fonts.rsans }
              }
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
  routeName: string;
  IconComponent: React.FC<any>;
  onPress: () => void;
  onLongPress: () => void;
  activeColor: string;
  inactiveColor: string;
  labelStyle: any;
}

function TabButton({
  isFocused,
  label,
  routeName,
  IconComponent,
  onPress,
  onLongPress,
  activeColor,
  inactiveColor,
  labelStyle,
}: TabButtonProps) {
  const scale = useSharedValue(1);
  const focusAnim = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    scale.value = withTiming(isFocused ? 1.1 : 1, { duration: 200 });
    focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const animatedIconContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedActiveIconStyle = useAnimatedStyle(() => ({
    opacity: focusAnim.value,
  }));

  const animatedInactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - focusAnim.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isFocused ? 1 : 0.6, { duration: 200 }),
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isFocused ? 1 : 0.6, { duration: 400 }),
    height: withTiming(isFocused ? "100%" : "0%", { duration: 400 }),
    width: withTiming(isFocused ? "100%" : "0%", { duration: 400 }),
  }));

  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // Determine stroke width based on route
  let inactiveStrokeWidth = 2;
  switch (routeName) {
    case "index":
      inactiveStrokeWidth = 28;
      break;
    case "schedule":
      inactiveStrokeWidth = 1;
      break;
    default:
      inactiveStrokeWidth = 2;
      break;
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
    >
      <Animated.View
        key={label}
        style={[
          animatedPillStyle,
          {
            backgroundColor:
              colorScheme === "dark" ? `${colors.tint}30` : `${colors.tint}25`,
            borderRadius: BorderRadius.lg,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
        ]}
      />
      <Animated.View
        style={[
          animatedIconContainerStyle,
          { marginBottom: 4, width: 24, height: 24 },
        ]}
      >
        {/* Inactive Icon Layer (Stroked) */}
        <Animated.View
          style={[StyleSheet.absoluteFill, , animatedInactiveIconStyle]}
        >
          <IconComponent
            width={24}
            height={24}
            fill="none"
            stroke={inactiveColor}
            strokeWidth={inactiveStrokeWidth}
          />
        </Animated.View>

        {/* Active Icon Layer (Filled) */}
        <Animated.View
          style={[StyleSheet.absoluteFill, animatedActiveIconStyle]}
        >
          <IconComponent
            width={24}
            height={24}
            fill={activeColor}
            stroke="none"
            strokeWidth={0}
          />
        </Animated.View>
      </Animated.View>

      <Animated.Text
        style={[
          styles.label,
          { color: isFocused ? activeColor : inactiveColor },
          labelStyle,
          animatedTextStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

// ─── Helper: Get Icon Component ──────────────────────────────────────

function getIconComponent(routeName: string): React.FC<any> {
  switch (routeName) {
    case "index":
      return HomeIcon;
    case "explore":
      return CompassIcon;
    case "schedule":
      return CalendarIcon;
    case "profile":
      return ProfileIcon;
    default:
      return HomeIcon; // Fallback
  }
}

// ─── Styles ──────────────────────────────────────────────────────────

const TAB_HEIGHT = 60;

const styles = StyleSheet.create({
  container: {
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 0, // clean look
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  contentContainer: {
    flexDirection: "row",
    height: TAB_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    // Ensure the rounded corners clip content if using background color on container
    overflow: "hidden",
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  tabButton: {
    position: "relative",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    overflow: "visible",
  },
  label: {
    fontSize: 10,
    textAlign: "center",
  },
});
