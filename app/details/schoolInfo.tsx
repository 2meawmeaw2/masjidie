import { BackButton } from "@/components/ui/backButton";
import {
  BorderRadius,
  Colors,
  Fonts,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBookmarksStore } from "@/lib/stores/bookmarksStore";
import { useIslamicSchoolsStore } from "@/lib/stores/islamicSchoolsStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HERO_HEIGHT = 300;
const SPRING_CONFIG = { damping: 18, stiffness: 220, mass: 0.4 };

export default function SchoolDetails() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { getSchoolById, fetchSchools, isLoading } = useIslamicSchoolsStore();
  const { isSchoolSaved, toggleSchool } = useBookmarksStore();

  useEffect(() => {
    fetchSchools();
  }, []);

  const school = getSchoolById(id as string);

  if (isLoading && !school) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!school) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, fontFamily: Fonts.mdsans }}>
          المدرسة غير موجودة
        </Text>
      </View>
    );
  }

  const saved = isSchoolSaved(school.id);

  const genderLabel =
    school.gender === "male"
      ? "ذكور"
      : school.gender === "female"
        ? "إناث"
        : "مختلط";

  const genderIcon =
    school.gender === "male"
      ? "male"
      : school.gender === "female"
        ? "female"
        : "people";

  const handleBookmark = () => {
    toggleSchool(school.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerTintColor: "#fff",
          headerShown: false,
        }}
      />
      <StatusBar barStyle="light-content" />
      <BackButton />

      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xl * 3 }}
      >
        {/* 1. Hero Image with overlay */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: school.imageUrl }}
            style={StyleSheet.absoluteFill}
          />

          {/* Full gradient overlay */}
          <LinearGradient
            colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.7)"]}
            locations={[0.25, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Bookmark button — top left */}
          <Pressable
            onPress={handleBookmark}
            style={[
              styles.heroBookmarkBtn,
              { backgroundColor: saved ? theme.primary : "rgba(0,0,0,0.35)" },
            ]}
            hitSlop={8}
          >
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={18}
              color="#FFF"
            />
          </Pressable>

          {/* School name + location overlaid on image */}
          <View style={styles.heroFooter}>
            <Text style={styles.heroSchoolName}>{school.name}</Text>
            {school.mapsUrl ? (
              <Pressable
                onPress={() => Linking.openURL(school.mapsUrl!)}
                style={styles.heroLocationRow}
              >
                <Ionicons
                  name="location"
                  size={14}
                  color="rgba(255,255,255,0.85)"
                />
                <Text style={styles.heroLocationText}>
                  {school.city}، {school.address}
                </Text>
                <Ionicons
                  name="open-outline"
                  size={12}
                  color="rgba(255,255,255,0.6)"
                />
              </Pressable>
            ) : (
              <View style={styles.heroLocationRow}>
                <Ionicons
                  name="location"
                  size={14}
                  color="rgba(255,255,255,0.85)"
                />
                <Text style={styles.heroLocationText}>
                  {school.city}، {school.address}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Body content */}
        <View
          style={[
            styles.body,
            { backgroundColor: theme.background, marginTop: -Spacing.lg },
          ]}
        >
          {/* 2. Stats Grid — 2-column */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.statsGrid}
          >
            {school.studentCount != null && (
              <StatCard
                icon="school"
                label="عدد الطلاب"
                value={`${school.studentCount} طالب`}
                theme={theme}
                isDark={isDark}
              />
            )}
            {school.founded && (
              <StatCard
                icon="calendar"
                label="سنة التأسيس"
                value={school.founded}
                theme={theme}
                isDark={isDark}
              />
            )}
            {school.ageRange && (
              <StatCard
                icon="body"
                label="الفئة العمرية"
                value={school.ageRange}
                theme={theme}
                isDark={isDark}
              />
            )}
            <StatCard
              icon={genderIcon}
              label="الجنس"
              value={genderLabel}
              theme={theme}
              isDark={isDark}
            />
          </Animated.View>

          {/* 3. Description */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Section title="نبذة عن المدرسة" theme={theme}>
              <Text
                style={[styles.description, { color: theme.textSecondary }]}
              >
                {school.description}
              </Text>
            </Section>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* 4. Programs */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Section title="البرامج المقدمة" theme={theme}>
              <View style={styles.programsContainer}>
                {school.programs.map((program, index) => (
                  <View
                    key={index}
                    style={[
                      styles.programTag,
                      {
                        backgroundColor: isDark
                          ? theme.primary + "18"
                          : theme.primary + "12",
                        borderColor: isDark
                          ? theme.primary + "30"
                          : theme.primary + "20",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.programDot,
                        { backgroundColor: theme.accent },
                      ]}
                    />
                    <Text style={[styles.programText, { color: theme.text }]}>
                      {program}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>
          </Animated.View>

          {/* 5. Contact Info */}
          {(school.phone || school.email || school.website) && (
            <Animated.View entering={FadeInDown.duration(400).delay(400)}>
              <Section title="معلومات التواصل" theme={theme}>
                <View style={styles.contactContainer}>
                  {school.phone && (
                    <ContactRow
                      icon="call-outline"
                      value={school.phone}
                      theme={theme}
                      isDark={isDark}
                      onPress={() => Linking.openURL(`tel:${school.phone}`)}
                    />
                  )}
                  {school.email && (
                    <ContactRow
                      icon="mail-outline"
                      value={school.email}
                      theme={theme}
                      isDark={isDark}
                      onPress={() => Linking.openURL(`mailto:${school.email}`)}
                    />
                  )}
                  {school.website && (
                    <ContactRow
                      icon="globe-outline"
                      value={school.website.replace("https://", "")}
                      theme={theme}
                      isDark={isDark}
                      onPress={() => Linking.openURL(school.website!)}
                    />
                  )}
                </View>
              </Section>
            </Animated.View>
          )}

          {/* 6. Bookmark CTA at bottom */}
          <Animated.View entering={FadeInDown.duration(400).delay(500)}>
            <BookmarkButton
              saved={saved}
              theme={theme}
              onPress={handleBookmark}
              label={saved ? t("bookmarks.saved") : t("bookmarks.save")}
            />
          </Animated.View>
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
      {
        backgroundColor: theme.card,
        borderColor: theme.border,
      },
      isDark ? Shadows.dark : Shadows.light,
    ]}
  >
    <View
      style={[
        styles.iconCircle,
        {
          backgroundColor: isDark ? theme.primary + "20" : theme.primary + "12",
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={theme.primary} />
    </View>
    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
      {label}
    </Text>
    <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const ContactRow = ({ icon, value, theme, isDark, onPress }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.98, SPRING_CONFIG);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_CONFIG);
        }}
        style={[
          styles.contactRow,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.contactIcon,
            {
              backgroundColor: isDark
                ? theme.primary + "20"
                : theme.primary + "12",
            },
          ]}
        >
          <Ionicons name={icon} size={18} color={theme.primary} />
        </View>
        <Text
          style={[styles.contactText, { color: theme.primary }]}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Ionicons name="chevron-back" size={16} color={theme.icon} />
      </Pressable>
    </Animated.View>
  );
};

const BookmarkButton = ({ saved, theme, onPress, label }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, SPRING_CONFIG);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_CONFIG);
        }}
        style={[
          styles.bookmarkCta,
          {
            backgroundColor: saved ? theme.primary : "transparent",
            borderColor: theme.primary,
          },
        ]}
      >
        <Ionicons
          name={saved ? "bookmark" : "bookmark-outline"}
          size={20}
          color={saved ? "#FFF" : theme.primary}
        />
        <Text
          style={[
            styles.bookmarkCtaText,
            { color: saved ? "#FFF" : theme.primary },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

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

  // Hero
  heroContainer: {
    height: HERO_HEIGHT,
    width: "100%",
    backgroundColor: "#1a1a1a",
  },
  heroBookmarkBtn: {
    position: "absolute",
    top: 52,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  heroFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + Spacing.sm,
  },
  heroSchoolName: {
    color: "#FFF",
    fontSize: 24,
    fontFamily: Fonts.bdsans,
    textAlign: "left",
    marginBottom: Spacing.xs,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroLocationText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontFamily: Fonts.rsans,
  },

  // Body
  body: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },

  // Stats — 2-column grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm + 2,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: "48%",
    flexGrow: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "flex-start",
    gap: Spacing.xs + 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
    textAlign: "left",
  },
  statValue: {
    fontSize: 15,
    fontFamily: Fonts.bdsans,
    textAlign: "left",
  },

  // Divider
  divider: {
    height: 1,
    width: "100%",
    marginVertical: Spacing.md,
  },

  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bdsans,
    marginBottom: Spacing.md,
    textAlign: "left",
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
    lineHeight: 24,
    textAlign: "left",
  },

  // Programs
  programsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  programTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  programDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  programText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },

  // Contact
  contactContainer: {
    gap: Spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.mdsans,
    textAlign: "left",
  },

  // Bookmark CTA
  bookmarkCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginTop: Spacing.sm,
  },
  bookmarkCtaText: {
    fontSize: 15,
    fontFamily: Fonts.sbsans,
  },
});
