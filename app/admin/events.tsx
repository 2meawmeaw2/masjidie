import ScreenHeader from "@/components/settings/Header";
import { Colors, Shadows } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/lib/stores/authStore";
import { useEventsStore } from "@/lib/stores/eventsStore";
import { useRequestsStore } from "@/lib/stores/requestsStore";
import { supabase } from "@/lib/supabase";
import { PRAYER_LABELS, PrayerId } from "@/lib/types/schedule";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface EventRow {
  id: string;
  title: string;
  date: string | null;
  type: string | null;
  category_id: string | null;
  time_anchor: string | null;
  prayer_id: string | null;
  prayer_offset: number | null;
  start_time: string | null;
  day_of_week: number | null;
}

const DAY_LABELS_SHORT = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

function eventSubtitle(item: EventRow): string {
  if (item.time_anchor === "prayer" && item.prayer_id) {
    const label = PRAYER_LABELS[item.prayer_id as PrayerId] ?? item.prayer_id;
    const offset = item.prayer_offset ?? 0;
    if (offset === 0) return `عند ${label}`;
    const abs = Math.abs(offset);
    const dir = offset > 0 ? "بعد" : "قبل";
    return `${dir} ${label} بـ ${abs} د`;
  }
  if (item.type === "one_off") return item.date ?? "One-off";
  if (item.start_time) return item.start_time;
  return "";
}

function eventTypeBadge(item: EventRow): { label: string; color: string } {
  if (item.type === "one_off") return { label: "لمرة واحدة", color: "#D97706" };
  const day =
    item.day_of_week != null ? DAY_LABELS_SHORT[item.day_of_week] : null;
  return {
    label: day ? `كل ${day}` : "متكرر",
    color: "#2563EB",
  };
}

export default function AdminEventsScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const shadow = Shadows[theme];
  const router = useRouter();
  const { mosqueId, isSuperAdmin } = useAuthStore();
  const { invalidateCache } = useEventsStore();
  const { submitRequest, mosqueApproved } = useRequestsStore();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin && !mosqueApproved) {
      router.replace("/admin");
    }
  }, [isSuperAdmin, mosqueApproved]);

  const loadEvents = async () => {
    if (!mosqueId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("events_activities")
      .select(
        "id, title, date, type, category_id, time_anchor, prayer_id, prayer_offset, start_time, day_of_week",
      )
      .eq("mosque_id", mosqueId)
      .order("title");

    if (!error && data) {
      setEvents(data as EventRow[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin || mosqueApproved) {
      loadEvents();
    }
  }, [mosqueId, isSuperAdmin, mosqueApproved]);

  const handleDelete = (id: string, title: string) => {
    Alert.alert("حذف الفعالية", `هل أنت متأكد من حذف "${title}"؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          if (isSuperAdmin) {
            await supabase.from("events_activities").delete().eq("id", id);
            invalidateCache();
            setEvents((prev) => prev.filter((e) => e.id !== id));
          } else {
            const ok = await submitRequest(
              "delete_event",
              "events_activities",
              id,
              { id, title },
            );
            if (ok) {
              Alert.alert("تم الإرسال", "تم إرسال طلب الحذف للمراجعة.");
            } else {
              Alert.alert("خطأ", "فشل في إرسال طلب التحديث.");
            }
          }
        },
      },
    ]);
  };

  if (!mosqueId) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          لا يوجد مسجد مرتبط بحسابك.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header area */}
      <ScreenHeader title="فعاليات" />
      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <Text style={[styles.countText, { color: colors.text }]}>
            {events.length} فعالية
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.newButton,
            { backgroundColor: colors.primary },
            shadow,
          ]}
          onPress={() => router.push("/admin/editEvent")}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newButtonText}>إضافة فعالية</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color={colors.primary}
          size="large"
        />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                لا توجد فعاليات بعد
              </Text>
              <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                {"اضغط على \"إضافة فعالية\" لإنشاء واحدة"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const badge = eventTypeBadge(item);
            const subtitle = eventSubtitle(item);
            return (
              <TouchableOpacity
                style={[
                  styles.row,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/admin/editEvent",
                    params: { id: item.id },
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.rowContent}>
                  <View style={styles.rowTop}>
                    <Text
                      style={[styles.rowTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, item.title)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.deleteBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.rowMeta}>
                    {/* Type badge */}
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: badge.color + "18" },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>

                    {/* Category */}
                    {item.category_id && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: colors.primary + "18" },
                        ]}
                      >
                        <Text
                          style={[styles.badgeText, { color: colors.primary }]}
                        >
                          {item.category_id}
                        </Text>
                      </View>
                    )}

                    {/* Time / Prayer info */}
                    {subtitle !== "" && (
                      <View style={styles.timeRow}>
                        <Ionicons
                          name={
                            item.time_anchor === "prayer"
                              ? "moon-outline"
                              : "time-outline"
                          }
                          size={13}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.timeText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {subtitle}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 20,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerInfo: { flex: 1 },
  countText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  newButtonText: {
    color: "#fff",
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 14,
  },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 30, gap: 10 },

  // Empty
  emptyContainer: { alignItems: "center", marginTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: "IBMPlexSansArabic-Medium" },
  emptyHint: { fontSize: 13, fontFamily: "IBMPlexSansArabic-Regular" },

  // Row
  row: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowContent: { gap: 8 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic-SemiBold",
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic-Medium",
    textTransform: "capitalize",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  timeText: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic-Regular",
  },
});
