import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { AnimatedTabBar } from "@/components/navigation/AnimatedTabBar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <>
      <Tabs
        tabBar={(props) => <AnimatedTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("tabs.home"),
            animation: "shift",

            // Icons are handled in AnimatedTabBar, but keeping these for fallback or type safety isn't harmful
            // though AnimatedTabBar ignores them.
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: t("tabs.explore"),
            animation: "shift",
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: t("tabs.schedule"),
            animation: "shift",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("tabs.profile"),
            animation: "shift",
          }}
        />
      </Tabs>
      <ThemeToggle />
    </>
  );
}
