import { PortalProvider } from "@gorhom/portal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { AppState, I18nManager } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import BatteryOptimizationModal from "@/components/BatteryOptimizationModal";
import { fontAssets } from "@/constants/fonts";
import {
  ThemeProvider as AppThemeProvider,
  useTheme,
} from "@/context/ThemeContext";
import { initializeAlarms } from "@/lib/alarms";
import "@/lib/i18n";
import { useAdhanStore } from "@/lib/stores/adhanStore";
import { useAuthStore } from "@/lib/stores/authStore";

const ONBOARDING_KEY = "@masjidie/onboarding_completed";

SplashScreen.preventAutoHideAsync();

// Show alarm notifications even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Force RTL layout
if (!I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  } catch (e) {
    console.error("Failed to force RTL", e);
  }
}

function RootLayoutContent() {
  const { theme } = useTheme();
  const [loaded] = useFonts(fontAssets);
  const { initialize } = useAuthStore();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  const appStateRef = useRef(AppState.currentState);

  // Check onboarding status
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setOnboardingDone(value === "true");
    });
  }, []);

  useEffect(() => {
    if (loaded && onboardingDone !== null) {
      SplashScreen.hideAsync();
      initializeAlarms();
      initialize();

      if (!onboardingDone) {
        router.replace("/onboarding");
      }
    }
  }, [loaded, onboardingDone]);

  // Recalculate prayer times when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        const { initialized, recalculateAndSchedule } =
          useAdhanStore.getState();
        if (initialized) {
          recalculateAndSchedule();
        }
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  if (!loaded || onboardingDone === null) {
    return null;
  }

  return (
    <NavThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="details/mosqueInfo"
          options={{ animation: "ios_from_right" }}
        />
        <Stack.Screen
          name="details/eventInfo"
          options={{ animation: "ios_from_right" }}
        />
        <Stack.Screen
          name="details/schoolInfo"
          options={{ animation: "ios_from_right" }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{ animation: "ios_from_left", headerShown: false }}
        />
        <Stack.Screen
          name="admin"
          options={{ animation: "ios_from_left", headerShown: false }}
        />
      </Stack>
      <StatusBar style="auto" />
      <BatteryOptimizationModal />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PortalProvider>
        <AppThemeProvider>
          <RootLayoutContent />
        </AppThemeProvider>
      </PortalProvider>
    </GestureHandlerRootView>
  );
}
