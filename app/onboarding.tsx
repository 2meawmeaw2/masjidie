import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LogoCrescent from "@/assets/logoElements/Vector-1.svg";
import LogoBase from "@/assets/logoElements/Vector-2.svg";
import LogoDome from "@/assets/logoElements/Vector.svg";
import { Colors, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";

const ONBOARDING_KEY = "@masjidie/onboarding_completed";

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  // Subtle float for the crescent
  // Change this:
  const crescentY = useSharedValue(26); // Start at 0 for offset
  const crescentSway = useSharedValue(0);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ready) return;

    // Vertical Float (Up and Down)
    crescentY.value = withRepeat(
      withTiming(20, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    // Horizontal Sway (Left and Right)
    crescentSway.value = withRepeat(
      withTiming(5, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    // Subtle Pulse (Breathing effect)
  }, [ready]);

  const crescentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: crescentY.value },
      { translateX: crescentSway.value },
      { rotateZ: "15deg" }, // Keep a slight tilt for character
    ],
  }));

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/location-permission");
  }, []);

  const logoWidth = 220;
  const domeHeight = logoWidth * (313 / 501);
  const baseWidth = logoWidth;
  const baseHeight = baseWidth * (251 / 501);
  const crescentWidth = logoWidth * 0.4;
  const crescentHeight = crescentWidth * (195 / 198);

  const [viewHeight, setViewHeight] = useState<number>(0);

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setViewHeight(height);
    setReady(true);
  };

  const gradientColors =
    theme === "dark"
      ? ([colors.background, "#0a1f2d", "#071a24"] as const)
      : ([colors.background, "#d4edec", "#c2e4e2"] as const);

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      {/* Logo assembly */}
      <View
        onLayout={handleLayout}
        style={[styles.logoArea, { marginTop: insets.top + 40 }]}
      >
        {/* Dome — drops in from top */}
        <Animated.View
          entering={FadeInUp.delay(300)
            .duration(800)
            .easing(Easing.inOut(Easing.sin))}
          style={[styles.logoPiece, {}]}
        >
          <LogoDome width={logoWidth} height={domeHeight} />
        </Animated.View>

        {/* Crescent — fades in with floating animation */}
        {ready && (
          <Animated.View
            entering={FadeInUp.delay(800)
              .duration(1000)
              .easing(Easing.inOut(Easing.sin))}
            key={0}
            style={[
              styles.crescentOverlay,
              crescentStyle,

              {
                marginTop: -domeHeight * 0.38,
                marginLeft: logoWidth * 0.05,
                position: "absolute",
                top: viewHeight / 2,
              },
            ]}
          >
            <LogoCrescent width={crescentWidth} height={crescentHeight} />
          </Animated.View>
        )}
        <Animated.View
          key={1}
          style={[
            styles.crescentOverlay,
            crescentStyle,
            {
              opacity: 0,
              marginTop: -domeHeight * 0.38,
              marginLeft: logoWidth * 0.05,
            },
          ]}
        >
          <LogoCrescent width={crescentWidth} height={crescentHeight} />
        </Animated.View>
        {/* Base — rises from bottom */}
        <Animated.View
          entering={FadeInDown.delay(600)
            .duration(700)
            .easing(Easing.inOut(Easing.sin))}
          style={[styles.logoPiece, { marginTop: -8 }]}
        >
          <LogoBase width={baseWidth} height={baseHeight} />
        </Animated.View>
      </View>

      {/* App name */}
      <Animated.Text
        entering={FadeInDown.delay(1100)
          .duration(1000)
          .easing(Easing.inOut(Easing.sin))}
        style={[styles.appName, { color: colors.text }]}
      >
        {t("app_name")}
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text
        entering={FadeIn.delay(1400)
          .duration(1000)
          .easing(Easing.inOut(Easing.sin))}
        style={[styles.subtitle, { color: colors.textSecondary }]}
      >
        {t("onboarding.subtitle")}
      </Animated.Text>
      {/*bottom*/}
      <Animated.View
        entering={FadeInDown.delay(1800)
          .duration(1000)
          .easing(Easing.inOut(Easing.sin))}
        style={[
          {
            width: "100%",
            height: 130,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            borderTopRightRadius: 30,
            borderTopLeftRadius: 30,
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: Math.max(insets.bottom, Spacing.xl),
            zIndex: 1,
            elevation: 8,
            shadowColor: colors.tint,
          },
        ]}
      >
        <Animated.View
          entering={FadeInDown.delay(1800)
            .duration(1000)
            .easing(Easing.inOut(Easing.sin))}
          style={[
            styles.buttonWrapper,
            { paddingBottom: Math.max(insets.bottom, Spacing.xl) },
          ]}
        >
          <Pressable
            onPress={completeOnboarding}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.buttonText}>{t("onboarding.get_started")}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  logoArea: {
    alignItems: "center",
  },
  logoPiece: {
    alignItems: "center",
  },
  crescentOverlay: {
    zIndex: 1,
    alignItems: "center",
  },
  appName: {
    fontSize: 36,
    fontFamily: Fonts.bdsans,
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.rsans,
    textAlign: "center",
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.xl,
    lineHeight: 24,
  },
  buttonWrapper: {
    position: "absolute",
    bottom: 0,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: Fonts.sbsans,
  },
});
