import ScreenHeader from "@/components/settings/Header";
import { Colors, Shadows } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/lib/stores/authStore";
import { useEventsStore } from "@/lib/stores/eventsStore";
import { useIslamicSchoolsStore } from "@/lib/stores/islamicSchoolsStore";
import { useMosquesStore } from "@/lib/stores/mosquesStore";
import { useRequestsStore } from "@/lib/stores/requestsStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminDashboard() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const shadow = Shadows[theme];
  const router = useRouter();
  const { user, mosqueId, isSuperAdmin, signOut } = useAuthStore();
  const { getMosqueById } = useMosquesStore();
  const { events, fetchEvents } = useEventsStore();
  const { fetchSchools, getSchoolByMosqueId } = useIslamicSchoolsStore();
  const {
    pendingCount,
    fetchPendingCount,
    fetchMyRequests,
    myRequests,
    mosqueApproved,
    checkMosqueApproval,
  } = useRequestsStore();

  const mosque = mosqueId ? getMosqueById(mosqueId) : null;

  // Fetch counts
  useEffect(() => {
    fetchEvents();
    fetchSchools();
    checkMosqueApproval();
    if (isSuperAdmin) {
      fetchPendingCount();
    } else {
      fetchMyRequests();
    }
  }, [isSuperAdmin]);

  const mosqueEvents = events.filter((e) => e.mosqueId === mosqueId);
  const mosqueSchool = mosqueId ? getSchoolByMosqueId(mosqueId) : null;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/onboarding");
  };

  const pendingMyRequests = myRequests.filter((r) => r.status === "pending");

  interface NavItem {
    label: string;
    description: string;
    icon:
      | keyof typeof Ionicons.glyphMap
      | keyof typeof MaterialCommunityIcons.glyphMap;
    route: any;
    color: string;
    badgeCount: number;
  }

  let navItems: NavItem[] = [
    ...(isSuperAdmin
      ? [
          {
            label: "الطلبات المعلقة",
            description:
              pendingCount > 0
                ? `${pendingCount} قيد الانتظار`
                : "لا توجد طلبات",
            icon: "document-text" as const,
            route: "/admin/requests" as const,
            color: "#D97706",
            badgeCount: pendingCount,
          },
        ]
      : [
          {
            label: "طلباتي",
            description:
              pendingMyRequests.length > 0
                ? `${pendingMyRequests.length} قيد الانتظار`
                : "أرشيف الطلبات",
            icon: "document-text" as const,
            route: "/admin/requests" as const,
            color: "#D97706",
            badgeCount: pendingMyRequests.length,
          },
        ]),
  ];

  if (isSuperAdmin || mosqueApproved) {
    navItems.push(
      {
        label: "معلومات المسجد",
        description: "تعديل التفاصيل، العنوان والخدمات",
        icon: "mosque" as const,
        route: "/admin/mosque" as const,
        color: colors.primary,
        badgeCount: 0,
      },
      {
        label: "الفعاليات",
        description: `${mosqueEvents.length} فعالية${mosqueEvents.length !== 1 ? "s" : ""}`,
        icon: "calendar" as const,
        route: "/admin/events" as const,
        color: "#2563EB",
        badgeCount: 0,
      },
      {
        label: "المدرسة",
        description: mosqueSchool ? "تم إنشاء مدرسة" : "لا توجد مدرسة بعد",
        icon: "school" as const,
        route: "/admin/editSchool" as const,
        color: "#D97706",
        badgeCount: 0,
      },
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="لوحة تحكم المشرف" />

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
          <Text style={[styles.welcomeLabel, { textAlign: "left" }]}>
            مرحباً بعودتك
          </Text>
          <Text
            style={[styles.welcomeEmail, { textAlign: "left" }]}
            numberOfLines={1}
          >
            {user?.email}
          </Text>
        </View>
      </View>

      {/* Banner */}
      {!isSuperAdmin && !mosqueApproved && (
        <View
          style={[
            styles.pendingBanner,
            {
              backgroundColor: colors.primary + "15",
              borderColor: colors.primary,
            },
          ]}
        >
          <Ionicons
            name="information-circle"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.pendingBannerText, { color: colors.text }]}>
            تسجيلك قيد المراجعة. ستتمكن من إدارة مسجدك بمجرد الموافقة عليه.
          </Text>
        </View>
      )}

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
            <MaterialCommunityIcons
              name="mosque"
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.mosqueInfo}>
            <Text style={[styles.mosqueLabel, { color: colors.textSecondary }]}>
              إدارة
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
          <Ionicons
            name="alert-circle"
            size={20}
            color={colors.textSecondary}
          />
          <Text
            style={[
              styles.mosqueLabel,
              { color: colors.textSecondary, marginLeft: 8 },
            ]}
          >
            معرف المسجد: {mosqueId}
          </Text>
        </View>
      )}

      {/* Navigation grid */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        الإدارة
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
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={{ position: "relative" }}>
              <View
                style={[
                  styles.navIconWrap,
                  { backgroundColor: item.color + "15" },
                ]}
              >
                {item.icon === "mosque" ? (
                  <MaterialCommunityIcons
                    name="mosque"
                    size={24}
                    color={item.color}
                  />
                ) : (
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={item.color}
                  />
                )}
              </View>
              {item.badgeCount > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{item.badgeCount}</Text>
                </View>
              )}
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
          تسجيل الخروج
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
  navBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#DC2626",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  navBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "IBMPlexSansArabic-Bold",
  },

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

  // Banner
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  pendingBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic-Medium",
    lineHeight: 20,
  },
});
