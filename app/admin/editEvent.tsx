import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/lib/stores/authStore";
import { useEventsStore } from "@/lib/stores/eventsStore";
import { useMosquesStore } from "@/lib/stores/mosquesStore";
import { useRequestsStore } from "@/lib/stores/requestsStore";
import { supabase } from "@/lib/supabase";
import { PRAYER_IDS, PRAYER_LABELS, PrayerId } from "@/lib/types/schedule";
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

const CATEGORY_IDS = [
  "tafsir",
  "fiqh",
  "lecture",
  "tahfidh",
  "seerah",
  "hadith",
  "children",
  "women",
];

const DAY_LABELS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export default function EditEventScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { mosqueId, isSuperAdmin } = useAuthStore();
  const { invalidateCache } = useEventsStore();
  const { submitRequest, mosqueApproved } = useRequestsStore();
  const { getMosqueById } = useMosquesStore();

  const mosque = mosqueId ? getMosqueById(mosqueId) : null;

  useEffect(() => {
    if (!isSuperAdmin && !mosqueApproved) {
      router.replace("/admin");
    }
  }, [isSuperAdmin, mosqueApproved]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "lecture",
    type: "recurring" as "recurring" | "one_off",
    date: "",
    start_time: "",
    end_time: "",
    day_of_week: "" as string,
    instructor: "",
    image_url: "",
    time_anchor: "fixed" as "fixed" | "prayer",
    prayer_id: "maghrib" as string,
    prayer_offset: "0",
    prayer_direction: "after" as "before" | "after",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("events_activities")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          const offset = data.prayer_offset ?? 0;
          setForm({
            title: data.title ?? "",
            description: data.description ?? "",
            category_id: data.category_id ?? "lecture",
            type: data.type === "one_off" ? "one_off" : "recurring",
            date: data.date ?? "",
            start_time: data.start_time ?? "",
            end_time: data.end_time ?? "",
            day_of_week:
              data.day_of_week != null ? String(data.day_of_week) : "",
            instructor: data.instructor ?? "",
            image_url: data.image_url ?? "",
            time_anchor: data.time_anchor === "prayer" ? "prayer" : "fixed",
            prayer_id: data.prayer_id ?? "maghrib",
            prayer_offset: String(Math.abs(offset)),
            prayer_direction: offset < 0 ? "before" : "after",
          });
        }
        setIsLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert("تنبيه", "العنوان مطلوب.");
      return;
    }
    if (!mosqueId) return;
    setIsSaving(true);

    const offsetNum = parseInt(form.prayer_offset, 10) || 0;
    const signedOffset =
      form.prayer_direction === "before" ? -offsetNum : offsetNum;

    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description || null,
      category_id: form.category_id || null,
      type: form.type,
      date: form.type === "one_off" ? form.date || null : null,
      day_of_week:
        form.type === "recurring" && form.day_of_week !== ""
          ? Number(form.day_of_week)
          : null,
      instructor: form.instructor || null,
      image_url: form.image_url || mosque?.imageUrl || null,
      mosque_id: mosqueId,
      mosque_name: mosque?.name ?? null,
      mosque_city: mosque?.city ?? null,
      time_anchor: form.time_anchor,
    };

    if (form.time_anchor === "fixed") {
      payload.start_time = form.start_time || null;
      payload.end_time = form.end_time || null;
      payload.prayer_id = null;
      payload.prayer_offset = null;
    } else {
      payload.start_time = null;
      payload.end_time = null;
      payload.prayer_id = form.prayer_id;
      payload.prayer_offset = signedOffset;
    }

    if (isSuperAdmin) {
      let error;
      if (id) {
        ({ error } = await supabase
          .from("events_activities")
          .update(payload)
          .eq("id", id));
      } else {
        payload.id = `evt_${Date.now()}`;
        ({ error } = await supabase.from("events_activities").insert(payload));
      }

      if (error) {
        Alert.alert("خطأ", error.message);
      } else {
        invalidateCache();
        router.back();
      }
    } else {
      const recordId = id ?? `evt_${Date.now()}`;
      if (!id) payload.id = recordId;
      const actionType = id ? "update_event" : "create_event";
      const ok = await submitRequest(
        actionType,
        "events_activities",
        recordId,
        payload as Record<string, unknown>,
      );
      if (ok) {
        Alert.alert("تم الإرسال", "تم إرسال طلب الفعالية للمراجعة.", [
          { text: "موافق", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("خطأ", "فشل في إرسال طلب الفعالية.");
      }
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const sectionCard = (children: React.ReactNode) => (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );

  const sectionHeader = (title: string) => (
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
  );

  const field = (
    label: string,
    key: keyof typeof form,
    options?: {
      multiline?: boolean;
      keyboard?: "default" | "numeric";
      placeholder?: string;
    },
  ) => (
    <View style={styles.fieldGroup} key={key}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
          },
          options?.multiline && styles.multilineInput,
        ]}
        value={form[key] as string}
        onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
        multiline={options?.multiline}
        keyboardType={options?.keyboard ?? "default"}
        placeholderTextColor={colors.textSecondary}
        placeholder={options?.placeholder}
      />
    </View>
  );

  const chip = (
    label: string,
    isActive: boolean,
    onPress: () => void,
    size: "sm" | "md" = "sm",
  ) => (
    <TouchableOpacity
      style={[
        styles.chip,
        { borderColor: colors.border },
        isActive && {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        size === "md" && styles.chipMd,
      ]}
      onPress={onPress}
    >
      <Text
        style={{
          color: isActive ? "#fff" : colors.text,
          fontSize: size === "md" ? 14 : 13,
          fontWeight: isActive ? "600" : "400",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.heading, { color: colors.text }]}>
        {id ? "تعديل الفعالية" : "فعالية جديدة"}
      </Text>

      {/* ── Basic Info ── */}
      {sectionHeader("معلومات أساسية")}
      {sectionCard(
        <>
          {field("العنوان *", "title")}
          {field("الوصف", "description", { multiline: true })}
          {field("المُحاضِـر / المعلم", "instructor")}
          {field("رابط الصورة", "image_url", { placeholder: "https://..." })}
        </>,
      )}

      {/* ── Category ── */}
      {sectionHeader("الفئة")}
      {sectionCard(
        <View style={styles.fieldGroup}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CATEGORY_IDS.map((cat) =>
                chip(cat, form.category_id === cat, () =>
                  setForm((f) => ({ ...f, category_id: cat })),
                ),
              )}
            </View>
          </ScrollView>
        </View>,
      )}

      {/* ── Schedule Type ── */}
      {sectionHeader("نوع الموعد")}
      {sectionCard(
        <>
          <View style={styles.fieldGroup}>
            <View style={styles.chipRow}>
              {chip(
                "متكرر",
                form.type === "recurring",
                () => setForm((f) => ({ ...f, type: "recurring" })),
                "md",
              )}
              {chip(
                "لمرة واحدة",
                form.type === "one_off",
                () => setForm((f) => ({ ...f, type: "one_off" })),
                "md",
              )}
            </View>
          </View>

          {form.type === "one_off" &&
            field("التاريخ (YYYY-MM-DD)", "date", {
              placeholder: "2026-03-15",
            })}

          {form.type === "recurring" && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                يوم الأسبوع
              </Text>
              <View style={styles.chipRow}>
                {DAY_LABELS.map((day, i) =>
                  chip(day, form.day_of_week === String(i), () =>
                    setForm((f) => ({ ...f, day_of_week: String(i) })),
                  ),
                )}
              </View>
            </View>
          )}
        </>,
      )}

      {/* ── Time Scheduling ── */}
      {sectionHeader("جدولة الوقت")}
      {sectionCard(
        <>
          <View style={styles.fieldGroup}>
            <View style={styles.chipRow}>
              {chip(
                "وقت محدد",
                form.time_anchor === "fixed",
                () => setForm((f) => ({ ...f, time_anchor: "fixed" })),
                "md",
              )}
              {chip(
                "بالنسبة لوقت الصلاة",
                form.time_anchor === "prayer",
                () => setForm((f) => ({ ...f, time_anchor: "prayer" })),
                "md",
              )}
            </View>
          </View>

          {form.time_anchor === "fixed" ? (
            <>
              {field("وقت البداية (HH:MM)", "start_time", {
                placeholder: "18:30",
              })}
              {field("وقت الانتهاء (HH:MM)", "end_time", {
                placeholder: "19:30",
              })}
            </>
          ) : (
            <>
              {/* Prayer picker */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  الصلاة
                </Text>
                <View style={styles.chipRow}>
                  {PRAYER_IDS.map((pid) =>
                    chip(
                      PRAYER_LABELS[pid],
                      form.prayer_id === pid,
                      () => setForm((f) => ({ ...f, prayer_id: pid })),
                      "md",
                    ),
                  )}
                </View>
              </View>

              {/* Before / After */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  التوقيت
                </Text>
                <View style={styles.chipRow}>
                  {chip(
                    "قبل",
                    form.prayer_direction === "before",
                    () =>
                      setForm((f) => ({ ...f, prayer_direction: "before" })),
                    "md",
                  )}
                  {chip(
                    "بعد",
                    form.prayer_direction === "after",
                    () => setForm((f) => ({ ...f, prayer_direction: "after" })),
                    "md",
                  )}
                </View>
              </View>

              {/* Offset */}
              {field("الفارق الزمني (بالدقائق)", "prayer_offset", {
                keyboard: "numeric",
                placeholder: "0",
              })}

              {/* Preview */}
              <View
                style={[
                  styles.previewBox,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[styles.previewText, { color: colors.textSecondary }]}
                >
                  {(() => {
                    const pLabel =
                      PRAYER_LABELS[form.prayer_id as PrayerId] ??
                      form.prayer_id;
                    const mins = parseInt(form.prayer_offset, 10) || 0;
                    if (mins === 0) return `عند ${pLabel}`;
                    const dir =
                      form.prayer_direction === "before" ? "قبل" : "بعد";
                    return `${dir} ${pLabel} بـ ${mins} د`;
                  })()}
                </Text>
              </View>
            </>
          )}
        </>,
      )}

      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: colors.primary },
          isSaving && { opacity: 0.6 },
        ]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>حفظ</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 20, paddingBottom: 40 },
  heading: {
    fontSize: 22,
    fontFamily: "IBMPlexSansArabic-Bold",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic-Bold",
    marginTop: 12,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 6,
  },
  fieldGroup: { marginBottom: 12 },
  label: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic-Medium",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  multilineInput: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipMd: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  previewBox: {
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 4,
  },
  previewText: { fontSize: 16, fontFamily: "IBMPlexSansArabic-SemiBold" },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontFamily: "IBMPlexSansArabic-Bold",
    fontSize: 16,
  },
});
