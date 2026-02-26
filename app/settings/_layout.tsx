import { Colors, Fonts } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function SettingsLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: Fonts.sbsans,
          fontSize: 17,
          color: colors.text,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "ios_from_right",
      }}
    >
      <Stack.Screen
        name="appearance"
        options={{
          animation: "ios_from_right",

          title: t("settings.appearanceTitle"),
        }}
      />
      <Stack.Screen
        name="adhan"
        options={{
          animation: "ios_from_right",

          title: t("adhan.title"),
        }}
      />
      <Stack.Screen
        name="location"
        options={{
          animation: "ios_from_right",

          title: t("settings.locationTitle"),
        }}
      />
    </Stack>
  );
}
