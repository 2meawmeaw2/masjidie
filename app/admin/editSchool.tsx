import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/lib/stores/authStore";
import { useIslamicSchoolsStore } from "@/lib/stores/islamicSchoolsStore";
import { useRequestsStore } from "@/lib/stores/requestsStore";
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

const GENDER_OPTIONS: {
  value: "male" | "female" | "mixed";
  label: string;
  icon: string;
}[] = [
  { value: "male", label: "ذكور", icon: "male" },
  { value: "female", label: "إناث", icon: "female" },
  { value: "mixed", label: "مختلط", icon: "people" },
];

export default function EditSchoolScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { mosqueId, isSuperAdmin } = useAuthStore();
  const { invalidateCache, fetchSchools, getSchoolByMosqueId } =
    useIslamicSchoolsStore();
  const { mosqueApproved } = useRequestsStore();

  useEffect(() => {
    if (!isSuperAdmin && !mosqueApproved) {
      router.replace("/admin");
    }
  }, [isSuperAdmin, mosqueApproved]);

  const [schoolId, setSchoolId] = useState<string | null>(id ?? null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    image_url: "",
    programs: "",
    gender: "mixed" as "male" | "female" | "mixed",
    age_range: "",
    student_count: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: if no id param, check if mosque already has a school
  useEffect(() => {
    const loadSchool = async () => {
      // Ensure schools are fetched
      await fetchSchools();

      let existingId = id ?? null;

      // If no explicit id, look up by mosqueId
      if (!existingId && mosqueId) {
        const existing = getSchoolByMosqueId(mosqueId);
        if (existing) {
          existingId = existing.id;
        }
      }

      if (existingId) {
        const { data } = await supabase
          .from("quran_schools")
          .select("*")
          .eq("id", existingId)
          .single();

        if (data) {
          setSchoolId(data.id);
          setForm({
            name: data.name ?? "",
            description: data.description ?? "",
            city: data.city ?? "",
            address: data.address ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            website: data.website ?? "",
            image_url: data.image_url ?? "",
            programs: Array.isArray(data.programs)
              ? data.programs.join(", ")
              : "",
            gender: data.gender ?? "mixed",
            age_range: data.age_range ?? "",
            student_count:
              data.student_count != null ? String(data.student_count) : "",
          });
        }
      }

      setIsLoading(false);
    };

    loadSchool();
  }, [id, mosqueId]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("تنبيه", "الاسم مطلوب.");
      return;
    }
    setIsSaving(true);

    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description || null,
      city: form.city || null,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      image_url: form.image_url || null,
      programs: form.programs
        ? form.programs
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
        : [],
      gender: form.gender,
      age_range: form.age_range || null,
      student_count: form.student_count ? Number(form.student_count) : null,
      mosque_id: mosqueId ?? null,
    };

    if (isSuperAdmin) {
      let error;
      if (schoolId) {
        ({ error } = await supabase
          .from("quran_schools")
          .update(payload)
          .eq("id", schoolId));
      } else {
        ({ error } = await supabase.from("quran_schools").insert(payload));
      }

      if (error) {
        Alert.alert("خطأ", error.message);
      } else {
        invalidateCache();
        await fetchSchools(true);
        router.back();
      }
    } else {
      const { submitRequest } = useRequestsStore.getState();
      const recordId = schoolId ?? `s_${Date.now()}`;
      if (!schoolId) payload.id = recordId;
      const actionType = schoolId ? "update_school" : "create_school";
      const ok = await submitRequest(
        actionType,
        "quran_schools",
        recordId,
        payload,
      );
      if (ok) {
        Alert.alert("تم الإرسال", "تم إرسال طلب التعديل للمراجعة.", [
          { text: "موافق", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("خطأ", "فشل في إرسال الطلب.");
      }
    }
    setIsSaving(false);
  };

  const handleDelete = () => {
    if (!schoolId) return;
    Alert.alert("حذف المدرسة", "هل أنت متأكد من حذف هذه المدرسة؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          if (isSuperAdmin) {
            const { error } = await supabase
              .from("quran_schools")
              .delete()
              .eq("id", schoolId);

            if (error) {
              Alert.alert("خطأ", error.message);
              setIsDeleting(false);
            } else {
              invalidateCache();
              await fetchSchools(true);
              router.back();
            }
          } else {
            const { submitRequest } = useRequestsStore.getState();
            const ok = await submitRequest(
              "delete_school",
              "quran_schools",
              schoolId,
              { id: schoolId },
            );
            if (ok) {
              Alert.alert("تم الإرسال", "تم إرسال طلب الحذف للمراجعة.", [
                { text: "موافق", onPress: () => router.back() },
              ]);
            } else {
              Alert.alert("خطأ", "فشل في إرسال طلب الحذف.");
              setIsDeleting(false);
            }
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const isEditing = !!schoolId;

  const sectionHeader = (title: string) => (
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
  );

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

  const field = (
    label: string,
    key: keyof typeof form,
    options?: {
      multiline?: boolean;
      keyboard?: "default" | "numeric" | "email-address" | "url";
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
        autoCapitalize="none"
      />
    </View>
  );

  const chip = (
    label: string,
    isActive: boolean,
    onPress: () => void,
    icon?: string,
  ) => (
    <TouchableOpacity
      style={[
        styles.chip,
        { borderColor: colors.border },
        isActive && {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
      ]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={14}
          color={isActive ? "#fff" : colors.text}
        />
      )}
      <Text
        style={{
          color: isActive ? "#fff" : colors.text,
          fontSize: 14,
          fontFamily: isActive
            ? "IBMPlexSansArabic-SemiBold"
            : "IBMPlexSansArabic-Regular",
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
        {isEditing ? "تعديل المدرسة" : "مدرسة جديدة"}
      </Text>

      {/* Basic Info */}
      {sectionHeader("تعلومات أساسية")}
      {sectionCard(
        <>
          {field("الاسم *", "name")}
          {field("الوصف", "description", { multiline: true })}
          {field("رابط الصورة", "image_url", {
            keyboard: "url",
            placeholder: "https://...",
          })}
        </>,
      )}

      {/* Location */}
      {sectionHeader("الموقع")}
      {sectionCard(
        <>
          {field("المدينة", "city")}
          {field("العنوان", "address")}
        </>,
      )}

      {/* Contact */}
      {sectionHeader("تواصل")}
      {sectionCard(
        <>
          {field("الهاتف", "phone")}
          {field("البريد الإلكتروني", "email", { keyboard: "email-address" })}
          {field("الموقع الإلكتروني", "website", {
            keyboard: "url",
            placeholder: "https://...",
          })}
        </>,
      )}

      {/* Programs & Students */}
      {sectionHeader("البرامج والطلاب")}
      {sectionCard(
        <>
          {field("البرامج (مفصولة بفواصل)", "programs", {
            placeholder: "تحفيظ القرآن, العلوم الشرعية, ...",
          })}
          {field("الفئة العمرية", "age_range", { placeholder: "6 - 18 سنة" })}
          {field("عدد الطلاب", "student_count", { keyboard: "numeric" })}

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              الجنس
            </Text>
            <View style={styles.chipRow}>
              {GENDER_OPTIONS.map((g) =>
                chip(
                  g.label,
                  form.gender === g.value,
                  () => setForm((f) => ({ ...f, gender: g.value })),
                  g.icon,
                ),
              )}
            </View>
          </View>
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

      {/* Delete button for existing schools */}
      {isEditing && (
        <TouchableOpacity
          style={[
            styles.deleteButton,
            { borderColor: colors.error },
            isDeleting && { opacity: 0.6 },
          ]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.deleteButtonText, { color: colors.error }]}>
                إزالة المدرسة
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
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
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 15,
  },
});
