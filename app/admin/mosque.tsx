import ScreenHeader from "@/components/settings/Header";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/lib/stores/authStore";
import { useMosquesStore } from "@/lib/stores/mosquesStore";
import { useRequestsStore } from "@/lib/stores/requestsStore";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function AdminMosqueScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { mosqueId, isSuperAdmin } = useAuthStore();
  const { invalidateCache, fetchMosques } = useMosquesStore();
  const { submitRequest, mosqueApproved } = useRequestsStore();
  const router = useRouter();

  useEffect(() => {
    if (!isSuperAdmin && !mosqueApproved) {
      router.replace("/admin");
    }
  }, [isSuperAdmin, mosqueApproved]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    description: "",
    imam: "",
    capacity: "",
    services: "",
    image_url: "",
    maps_url: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch mosque directly from Supabase on mount
  useEffect(() => {
    if (!mosqueId) {
      setIsLoadingData(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("mosques")
        .select("*")
        .eq("id", mosqueId)
        .single();

      if (data && !error) {
        setForm({
          name: data.name ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          description: data.description ?? "",
          imam: data.imam ?? "",
          capacity: data.capacity ?? "",
          services: Array.isArray(data.services)
            ? data.services.join(", ")
            : "",
          image_url: data.image_url ?? "",
          maps_url: data.maps_url ?? "",
        });
      }
      setIsLoadingData(false);
    })();
  }, [mosqueId]);

  const handleSave = async () => {
    if (!mosqueId) return;
    setIsSaving(true);

    if (isSuperAdmin) {
      const payload = {
        ...form,
        services: form.services
          ? form.services
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      };
      const { error } = await supabase
        .from("mosques")
        .update(payload)
        .eq("id", mosqueId);

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        invalidateCache();
        await fetchMosques(true);
        Alert.alert("تم الحفظ", "تم تحديث معلومات المسجد بنجاح.");
      }
    } else {
      const payload = {
        ...form,
        services: form.services
          ? form.services
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      };
      const ok = await submitRequest(
        "update_mosque",
        "mosques",
        mosqueId,
        payload,
      );
      if (ok) {
        Alert.alert("تم الإرسال", "تم إرسال التعديلات للمراجعة.");
      } else {
        Alert.alert("خطأ", "فشل في إرسال طلب التحديث.");
      }
    }
    setIsSaving(false);
  };

  if (isLoadingData) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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

  const field = (
    label: string,
    key: keyof typeof form,
    options?: { multiline?: boolean; placeholder?: string },
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
        value={form[key]}
        onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
        multiline={options?.multiline}
        placeholderTextColor={colors.textSecondary}
        placeholder={options?.placeholder}
      />
    </View>
  );

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Identity */}
      <ScreenHeader title="معلومات أساسية" />
      {sectionCard(
        <>
          {field("الاسم", "name")}
          {field("الوصف", "description", { multiline: true })}
          {field("الإمام", "imam")}
        </>,
      )}
      {/* Location */}
      {sectionHeader("الموقع")}
      {sectionCard(
        <>
          {field("العنوان", "address")}
          {field("المدينة", "city")}
          {field("رابط خرائط جوجل", "maps_url", {
            placeholder: "https://maps.app.goo.gl/...",
          })}
        </>,
      )}
      {/* Details */}
      {sectionHeader("تفاصيل")}
      {sectionCard(
        <>
          {field("السعة", "capacity")}
          {field("الخدمات", "services", { multiline: true })}
        </>,
      )}
      {/* Media */}
      {sectionHeader("الوسائط")}
      {sectionCard(
        <>
          {field("رابط الصورة", "image_url", { placeholder: "https://..." })}
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
            <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
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
  emptyText: { fontSize: 16, textAlign: "center" },
  content: { padding: 20, paddingBottom: 40 },
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
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
});
