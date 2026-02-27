import ScreenHeader from "@/components/settings/Header";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/lib/stores/authStore";
import { PendingRequest, useRequestsStore } from "@/lib/stores/requestsStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const;

const ACTION_LABELS: Record<string, string> = {
  register_mosque: "تسجيل مسجد",
  register_school: "تسجيل مدرسة",
  create_event: "إضافة فعالية",
  update_event: "تحديث فعالية",
  delete_event: "حذف فعالية",
  update_mosque: "تحديث مسجد",
  create_school: "إضافة مدرسة",
  update_school: "تحديث مدرسة",
  delete_school: "حذف مدرسة",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#D97706",
  approved: "#059669",
  rejected: "#DC2626",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminRequestsScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { isSuperAdmin } = useAuthStore();
  const {
    allRequests,
    myRequests,
    isLoading,
    fetchAllRequests,
    fetchMyRequests,
  } = useRequestsStore();

  const [filter, setFilter] = useState<string>("pending");

  const requests = isSuperAdmin ? allRequests : myRequests;

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAllRequests(filter);
    } else {
      fetchMyRequests();
    }
  }, [filter, isSuperAdmin]);

  const renderItem = ({ item }: { item: PendingRequest }) => {
    const statusColor = STATUS_COLORS[item.status] ?? colors.textSecondary;
    const actionLabel = ACTION_LABELS[item.action_type] ?? item.action_type;
    const entityName =
      ((item.payload as Record<string, unknown>)?.name as string) ??
      ((item.payload as Record<string, unknown>)?.title as string) ??
      item.target_record_id ??
      "—";

    return (
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() =>
          router.push({
            pathname: "/admin/reviewRequest",
            params: { id: item.id },
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.rowTop}>
          <View style={[styles.badge, { backgroundColor: statusColor + "18" }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>

        <Text
          style={[styles.actionLabel, { color: colors.text }]}
          numberOfLines={1}
        >
          {actionLabel}
        </Text>
        <Text
          style={[styles.entityName, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {entityName}
        </Text>

        {item.requester_email && isSuperAdmin && (
          <Text
            style={[styles.requesterEmail, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            بواسطة: {item.requester_email}
          </Text>
        )}

        {item.reviewer_note && (
          <Text
            style={[styles.reviewerNote, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            ملاحظة: {item.reviewer_note}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="الطلبات" />
      {/* Filter chips */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((s) => {
          const isActive = filter === s;
          return (
            <TouchableOpacity
              key={s}
              style={[
                styles.filterChip,
                { borderColor: colors.border },
                isActive && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setFilter(s)}
            >
              <Text
                style={{
                  color: isActive ? "#fff" : colors.text,
                  fontSize: 13,
                  fontFamily: isActive
                    ? "IBMPlexSansArabic-SemiBold"
                    : "IBMPlexSansArabic-Regular",
                  textTransform: "capitalize",
                }}
              >
                {s === "all"
                  ? "الكل"
                  : s === "pending"
                    ? "قيد الانتظار"
                    : s === "approved"
                      ? "مقبول"
                      : "مرفوض"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color={colors.primary}
          size="large"
        />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                لا توجد طلبات
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  list: { paddingHorizontal: 16, paddingBottom: 30, gap: 10 },
  emptyContainer: { alignItems: "center", marginTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: "IBMPlexSansArabic-Medium" },
  row: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "IBMPlexSansArabic-Bold",
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic-Regular",
  },
  actionLabel: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  entityName: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic-Regular",
  },
  requesterEmail: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic-Regular",
    marginTop: 2,
  },
  reviewerNote: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic-Regular",
    fontStyle: "italic",
    marginTop: 4,
  },
});
