import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import Animated from "react-native-reanimated";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useMosquesStore } from "@/lib/stores/mosquesStore";
import { useEventsStore } from "@/lib/stores/eventsStore";
import { ActivityCard } from "@/components/ActivityCard";
import { handleOpenMaps } from "@/lib/location";

export default function MosqueDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  // Get mosques and events from stores
  const { mosques, fetchMosques } = useMosquesStore();
  const { events, fetchEvents } = useEventsStore();

  React.useEffect(() => {
    if (mosques.length === 0) fetchMosques();
    if (events.length === 0) fetchEvents();
  }, []);

  const mosque = mosques.find((m) => m.id === id);

  if (!mosque) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, fontFamily: Fonts.mdsans }}>
          المسجد غير موجود
        </Text>
      </View>
    );
  }
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerTintColor: "#fff",
        }}
      />
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xl * 3 }}
      >
        {/* 1. Hero Image */}
        <View style={styles.imageContainer}>
          <Animated.Image
            source={{ uri: mosque.imageUrl }}
            style={styles.heroImage}
            // @ts-ignore
            sharedTransitionTag={`mosque-${id}`}
          />
          <View style={styles.overlay} />
        </View>

        <View
          style={[
            styles.body,
            { backgroundColor: theme.background, marginTop: -Spacing.xl },
          ]}
        >
          {/* 2. Title & Address Link */}
          <View style={styles.headerSection}>
            <Text style={[styles.mosqueName, { color: theme.tint }]}>
              {mosque.name}
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* 6. About Section */}
            <Section title="نبذة عن المسجد" theme={theme}>
              <Text
                style={[styles.description, { color: theme.tabIconDefault }]}
              >
                {mosque.description ||
                  "يعد هذا المسجد منارة للعلم والعبادة في المنطقة، حيث تقام فيه الصلوات الخمس والجمعة، بالإضافة إلى الدروس الدينية وحلقات تحفيظ القرآن الكريم."}
              </Text>
            </Section>

            <TouchableOpacity
              onPress={() => handleOpenMaps(mosque)}
              style={styles.addressLink}
            >
              <Ionicons name="location" size={18} color={theme.primary} />
              <Text
                style={[
                  styles.addressText,
                  { color: theme.primary, textDecorationLine: "underline" },
                ]}
              >
                {mosque.city}، {mosque.address} (اضغط للخريطة)
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3. Capacity & Imam (Stats Grid) */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="people"
              label="السعة"
              value={`${mosque.capacity ?? "غير محدد"} مصلي`}
              theme={theme}
              isDark={isDark}
            />
            <StatCard
              icon="person"
              label="الإمام"
              value={
                mosque.imam ?? "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f"
              }
              theme={theme}
              isDark={isDark}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* 4. Maraf9 (Facilities) */}
          <Section title="المرافق " theme={theme}>
            <View style={styles.facilitiesContainer}>
              {[
                "مصلى نساء",
                "وضوء",
                "مكيفات",
                "مكتبة",
                "مدخل كراسي",
                "موقف سيارات",
              ].map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.facilityTag,
                    {
                      backgroundColor: isDark
                        ? theme.card
                        : "rgba(27, 122, 78, 0.08)",
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.primary}
                  />
                  <Text style={[styles.facilityText, { color: theme.text }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </Section>

          {/* 5. Upcoming Events (Restored) */}
          <Section title="الأحداث القادمة" theme={theme}>
            {events
              .filter((activity) => activity.mosqueId === id)
              .slice(0, 3)
              .map((activity, index) => {
                return (
                  <ActivityCard
                    index={index}
                    key={activity.id}
                    activity={activity}
                    mosqueName={mosque?.name ?? ""}
                    imageUrl={activity?.imageUrl}
                    onPress={() => {
                      router.push(`/details/eventInfo?id=${activity.id}`);
                    }}
                  />
                );
              })}
          </Section>
        </View>
      </ScrollView>
    </>
  );
}

// --- Sub Components ---

const StatCard = ({ icon, label, value, theme, isDark }: any) => (
  <View
    style={[
      styles.statCard,
      { backgroundColor: theme.card, borderColor: theme.border },
    ]}
  >
    <View
      style={[
        styles.iconCircle,
        { backgroundColor: isDark ? "#333" : "#f2f2f2" },
      ]}
    >
      <Ionicons name={icon} size={22} color={theme.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  </View>
);

const EventItem = ({ title, date, time, theme, isDark }: any) => (
  <View
    style={[
      styles.eventCard,
      { backgroundColor: theme.card, borderColor: theme.border },
    ]}
  >
    <View
      style={[
        styles.dateBox,
        { backgroundColor: isDark ? "#333" : "rgba(27, 122, 78, 0.1)" },
      ]}
    >
      <Text style={[styles.dateText, { color: theme.primary }]}>
        {date.split("،")[1]?.trim() || date}
      </Text>
    </View>
    <View style={styles.eventContent}>
      <Text style={[styles.eventTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.eventTime, { color: theme.textSecondary }]}>
        {time}
      </Text>
    </View>
  </View>
);

const ActionButton = ({
  icon,
  label,
  onPress,
  theme,
  primary = false,
}: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.actionBtn,
      {
        backgroundColor: primary ? theme.primary : theme.card,
        borderColor: theme.border,
        borderWidth: primary ? 0 : 1,
      },
    ]}
  >
    <Ionicons name={icon} size={20} color={primary ? "#fff" : theme.text} />
    <Text
      style={[styles.actionLabel, { color: primary ? "#fff" : theme.text }]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const Section = ({ title, children, theme }: any) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    {children}
  </View>
);

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    direction: "rtl",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    height: 280,
    width: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  body: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  // Header Section
  headerSection: {
    marginBottom: Spacing.lg,
    alignItems: "flex-start",
  },
  mosqueName: {
    fontSize: 26,
    fontFamily: Fonts.bdsans,
    marginBottom: Spacing.xs,
    textAlign: "left",
  },
  addressLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  addressText: {
    fontSize: 15,
    fontFamily: Fonts.mdsans,
  },
  // Stats Grid
  statsGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
    textAlign: "left",
  },
  statValue: {
    fontSize: 14,
    fontFamily: Fonts.bdsans,
    textAlign: "left",
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: Spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },
  // Section Shared
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bdsans,
    marginBottom: Spacing.md,
    textAlign: "left",
  },
  // Facilities
  facilitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  facilityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  facilityText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },
  // Events
  eventCard: {
    flexDirection: "row",
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    alignItems: "center",
    direction: "rtl",
  },
  dateBox: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.md,
  },
  dateText: {
    fontSize: 12,
    fontFamily: Fonts.bdsans,
    textAlign: "center",
  },
  eventContent: {
    flex: 1,
    alignItems: "flex-start",
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: Fonts.bdsans,
    marginBottom: 4,
    textAlign: "left",
  },
  eventTime: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
    textAlign: "left",
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
    lineHeight: 24,
    textAlign: "left",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopWidth: 1,
    paddingBottom: Spacing.md + 20,
  },
  donateButton: {
    width: "100%",
    padding: 16,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  donateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: Fonts.bdsans,
  },
});
