import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/lib/stores/authStore";
import { useMosquesStore } from "@/lib/stores/mosquesStore";
import { useEventsStore } from "@/lib/stores/eventsStore";
import { useIslamicSchoolsStore } from "@/lib/stores/islamicSchoolsStore";

export default function AdminDashboard() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const shadow = Shadows[theme];
  const router = useRouter();
  const { user, mosqueId, signOut } = useAuthStore();
  const { getMosqueById } = useMosquesStore();
  const { events, fetchEvents } = useEventsStore();
  const { fetchSchools, getSchoolByMosqueId } = useIslamicSchoolsStore();

  const mosque = mosqueId ? getMosqueById(mosqueId) : null;

  // Fetch counts
  useEffect(() => {
    fetchEvents();
    fetchSchools();
  }, []);

  const mosqueEvents = events.filter((e) => e.mosqueId === mosqueId);
  const mosqueSchool = mosqueId ? getSchoolByMosqueId(mosqueId) : null;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(tabs)/");
  };

  const navItems = [
    {
      label: "Mosque Info",
      description: "Edit details, address & services",
      icon: "business" as const,
      route: "/admin/mosque" as const,
      color: colors.primary,
    },
    {
      label: "Events",
      description: `${mosqueEvents.length} event${mosqueEvents.length !== 1 ? "s" : ""}`,
      icon: "calendar" as const,
      route: "/admin/events" as const,
      color: "#2563EB",
    },
    {
      label: "School",
      description: mosqueSchool ? "Has school" : "No school yet",
      icon: "school" as const,
      route: "/admin/editSchool" as const,
      color: "#D97706",
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Welcome header */}
      <View
        style={[
          styles.welcomeCard,
          { backgroundColor: colors.primary },
          shadow,
        ]}
      >
        <View style={styles.welcomeIcon}>
          <Ionicons name="shield-checkmark" size={28} color="#fff" />
        </View>
        <View style={styles.welcomeInfo}>
          <Text style={styles.welcomeLabel}>Welcome back</Text>
          <Text style={styles.welcomeEmail} numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
      </View>

      {/* Mosque info */}
      {mosque && (
        <View
          style={[
            styles.mosqueCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            shadow,
          ]}
        >
          <View
            style={[
              styles.mosqueIconWrap,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons name="business" size={22} color={colors.primary} />
          </View>
          <View style={styles.mosqueInfo}>
            <Text style={[styles.mosqueLabel, { color: colors.textSecondary }]}>
              Managing
            </Text>
            <Text
              style={[styles.mosqueName, { color: colors.text }]}
              numberOfLines={1}
            >
              {mosque.name}
            </Text>
            <Text
              style={[styles.mosqueCity, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {mosque.city}
            </Text>
          </View>
        </View>
      )}
      {!mosque && mosqueId && (
        <View
          style={[
            styles.mosqueCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="alert-circle" size={20} color={colors.textSecondary} />
          <Text style={[styles.mosqueLabel, { color: colors.textSecondary, marginLeft: 8 }]}>
            Mosque ID: {mosqueId}
          </Text>
        </View>
      )}

      {/* Navigation grid */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Manage
      </Text>
      <View style={styles.navGrid}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.navItem,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadow,
            ]}
            onPress={() => router.push(item.route)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.navIconWrap,
                { backgroundColor: item.color + "15" },
              ]}
            >
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={[styles.navLabel, { color: colors.text }]}>
              {item.label}
            </Text>
            <Text
              style={[styles.navDescription, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
            <View style={styles.navArrow}>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <TouchableOpacity
        style={[styles.signOutButton, { borderColor: colors.border }]}
        onPress={handleSignOut}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={[styles.signOutText, { color: colors.error }]}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 16 },

  // Welcome
  welcomeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    gap: 14,
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeInfo: { flex: 1 },
  welcomeLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  welcomeEmail: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic-SemiBold",
    marginTop: 2,
  },

  // Mosque
  mosqueCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  mosqueIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mosqueInfo: { flex: 1 },
  mosqueLabel: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic-Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mosqueName: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic-SemiBold",
    marginTop: 1,
  },
  mosqueCity: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic-Regular",
    marginTop: 1,
  },

  // Section
  sectionTitle: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic-SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },

  // Nav grid
  navGrid: { gap: 10 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  navIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic-SemiBold",
    flex: 0,
  },
  navDescription: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic-Regular",
    flex: 1,
  },
  navArrow: { marginLeft: "auto" },

  // Sign out
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
});
