import {
  ThemeProvider as NavThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { I18nManager, Platform } from "react-native";

import "@/lib/i18n";
import { initializeAlarms } from "@/lib/alarms";
import BatteryOptimizationModal from "@/components/BatteryOptimizationModal";
import { fontAssets } from "@/constants/fonts";
import {
  ThemeProvider as AppThemeProvider,
  useTheme,
} from "@/context/ThemeContext";

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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      initializeAlarms();
    }
  }, [loaded]);

  if (!loaded) {
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
      </Stack>
      <StatusBar style="auto" />
      <BatteryOptimizationModal />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootLayoutContent />
    </AppThemeProvider>
  );
}
