import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/lib/stores/authStore";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

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
        animation: "ios_from_right",

        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          animation: "ios_from_right",
          headerShown: false,
          title: "لوحة تحكم المشرف",
        }}
      />
      <Stack.Screen
        name="mosque"
        options={{
          animation: "ios_from_right",
          headerShown: false,
          title: "معلومات المسجد",
        }}
      />
      <Stack.Screen
        name="events"
        options={{
          animation: "ios_from_right",
          headerShown: false,
          title: "الفعاليات",
        }}
      />
      <Stack.Screen
        name="editEvent"
        options={{
          animation: "ios_from_right",
          headerShown: false,
          title: "تعديل الفعالية",
        }}
      />
      <Stack.Screen
        name="editSchool"
        options={{
          animation: "ios_from_right",
          headerShown: false,
          title: "المدرسة القرآنية",
        }}
      />
      <Stack.Screen
        name="requests"
        options={{
          title: "الطلبات",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reviewRequest"
        options={{
          animation: "ios_from_right",
          headerShown: false,
          title: "مراجعة الطلب",
        }}
      />
    </Stack>
  );
}
