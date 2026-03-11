import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SmoothAnimations } from "@/constants/animations";
import React from "react";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface AnimatedHeaderBackgroundProps {
  style?: any;
  scrollY?: SharedValue<number>;
  scrollThreshold?: number;
  targetTranslateY?: number;
  animationDuration?: number;
}

export function AnimatedHeaderBackground({
  style,
  scrollY,
  scrollThreshold = 50,
  targetTranslateY = -100,
  animationDuration = 400,
}: AnimatedHeaderBackgroundProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const bgAnimStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return { transform: [{ translateY: 0 }] };
    }
    return {
      transform: [
        {
          translateY: withTiming(
            scrollY.value > scrollThreshold ? targetTranslateY : 0,
            {
              duration: animationDuration,
              easing: SmoothAnimations.layout,
            }
          ),
        },
      ],
    };
  }, [scrollY, scrollThreshold, targetTranslateY, animationDuration]);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          height: 280,
          zIndex: 0,
          backgroundColor: "#00996d",
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          elevation: 8,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        },
        bgAnimStyle,
        style,
      ]}
    />
  );
}
