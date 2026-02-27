import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/lib/stores/authStore";
import { PendingRequest, useRequestsStore } from "@/lib/stores/requestsStore";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

export default function ReviewRequestScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isSuperAdmin } = useAuthStore();
  const { approveRequest, rejectRequest } = useRequestsStore();

  const [request, setRequest] = useState<PendingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("pending_requests")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setRequest(data as PendingRequest);
        }
        setIsLoading(false);
      });
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    setIsProcessing(true);
    const ok = await approveRequest(id, note || undefined);
    if (ok) {
      Alert.alert("تمت الموافقة", "تمت الموافقة على الطلب.", [
        { text: "موافق", onPress: () => router.back() },
      ]);
    } else {
      const errMsg = useRequestsStore.getState().error;
      Alert.alert("خطأ", errMsg || "فشل في الموافقة على الطلب.");
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!id) return;
    setIsProcessing(true);
    const ok = await rejectRequest(id, note || undefined);
    if (ok) {
      Alert.alert("تم الرفض", "تم رفض الطلب.", [
        { text: "موافق", onPress: () => router.back() },
      ]);
    } else {
      const errMsg = useRequestsStore.getState().error;
      Alert.alert("خطأ", errMsg || "فشل في رفض الطلب.");
    }
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          لم يتم العثور على الطلب
        </Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[request.status] ?? colors.textSecondary;
  const actionLabel = ACTION_LABELS[request.action_type] ?? request.action_type;
  const payload = request.payload as Record<string, unknown> | null;
  const isPending = request.status === "pending";
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Status & action */}
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: statusColor + "18" }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {request.status.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>
          {actionLabel}
        </Text>
      </View>

      {/* Metadata */}
      <View
        style={[
          styles.metaCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <MetaRow
          label="صاحب الطلب"
          value={request.requester_email ?? "—"}
          colors={colors}
        />
        <MetaRow
          label="تاريخ التقديم"
          value={new Date(request.created_at).toLocaleString()}
          colors={colors}
        />
        <MetaRow label="الجدول" value={request.target_table} colors={colors} />
        <MetaRow
          label="معرف السجل"
          value={request.target_record_id ?? "—"}
          colors={colors}
        />
        {request.reviewed_at && (
          <MetaRow
            label="تاريخ المراجعة"
            value={new Date(request.reviewed_at).toLocaleString()}
            colors={colors}
          />
        )}
        {request.reviewer_note && (
          <MetaRow
            label="ملاحظة المراجع"
            value={request.reviewer_note}
            colors={colors}
          />
        )}
      </View>

      {/* Payload preview */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        تفاصيل البيانات
      </Text>
      <View
        style={[
          styles.payloadCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {payload ? (
          Object.entries(payload).map(([key, val]) => (
            <MetaRow
              key={key}
              label={key}
              value={
                val === null
                  ? "null"
                  : typeof val === "object"
                    ? JSON.stringify(val)
                    : String(val)
              }
              colors={colors}
            />
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            لا توجد بيانات مرفقة
          </Text>
        )}
      </View>

      {/* Super admin actions */}
      {isSuperAdmin && isPending && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            القرار
          </Text>
          <View
            style={[
              styles.noteCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>
              ملاحظة (اختياري)
            </Text>
            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                  textAlign: "right",
                },
              ]}
              value={note}
              onChangeText={setNote}
              placeholder="اكتب ملاحظة..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: "#059669" },
                isProcessing && { opacity: 0.6 },
              ]}
              onPress={handleApprove}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>قبول</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: "#DC2626" },
                isProcessing && { opacity: 0.6 },
              ]}
              onPress={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>رفض</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function MetaRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: Record<string, string>;
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[styles.metaValue, { color: colors.text }]}
        numberOfLines={3}
      >
        {value}
      </Text>
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
  content: { padding: 20, paddingBottom: 40 },
  emptyText: { fontSize: 16, textAlign: "center" },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic-Bold",
    letterSpacing: 0.5,
  },
  actionLabel: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic-SemiBold",
    flex: 1,
  },

  // Meta card
  metaCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic-Medium",
    width: 100,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic-Regular",
    flex: 1,
  },

  // Payload
  sectionTitle: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic-Bold",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  payloadCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    marginBottom: 16,
  },

  // Note
  noteCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  noteLabel: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic-Medium",
    marginBottom: 6,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: "top",
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontFamily: "IBMPlexSansArabic-Bold",
    fontSize: 15,
  },
});
