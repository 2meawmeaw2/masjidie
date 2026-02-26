import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";

export default function AdminLayout() {
  const { session } = useAuthStore();
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];

  useEffect(() => {
    if (!session) {
      router.replace("/auth/login");
    }
  }, [session]);

  if (!session) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: "IBMPlexSansArabic-SemiBold",
          fontSize: 17,
          color: colors.text,
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Admin Dashboard" }} />
      <Stack.Screen name="mosque" options={{ title: "Mosque Info" }} />
      <Stack.Screen name="events" options={{ title: "Events" }} />
      <Stack.Screen name="editEvent" options={{ title: "Edit Event" }} />
      <Stack.Screen name="editSchool" options={{ title: "School" }} />
    </Stack>
  );
}
