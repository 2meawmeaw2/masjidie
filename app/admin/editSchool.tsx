import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useIslamicSchoolsStore } from "@/lib/stores/islamicSchoolsStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { supabase } from "@/lib/supabase";

const GENDER_OPTIONS: { value: "male" | "female" | "mixed"; label: string; icon: string }[] = [
  { value: "male", label: "Male", icon: "male" },
  { value: "female", label: "Female", icon: "female" },
  { value: "mixed", label: "Mixed", icon: "people" },
];

export default function EditSchoolScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { mosqueId } = useAuthStore();
  const { invalidateCache, fetchSchools, getSchoolByMosqueId } =
    useIslamicSchoolsStore();

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
      Alert.alert("Validation", "Name is required.");
      return;
    }
    setIsSaving(true);

    const payload = {
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
      Alert.alert("Error", error.message);
    } else {
      invalidateCache();
      await fetchSchools(true);
      router.back();
    }
    setIsSaving(false);
  };

  const handleDelete = () => {
    if (!schoolId) return;
    Alert.alert("Remove School", "Are you sure you want to remove this school?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          const { error } = await supabase
            .from("quran_schools")
            .delete()
            .eq("id", schoolId);

          if (error) {
            Alert.alert("Error", error.message);
            setIsDeleting(false);
          } else {
            invalidateCache();
            await fetchSchools(true);
            router.back();
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
    }
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
    icon?: string
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
        {isEditing ? "Edit School" : "New School"}
      </Text>

      {/* Basic Info */}
      {sectionHeader("Basic Info")}
      {sectionCard(
        <>
          {field("Name *", "name")}
          {field("Description", "description", { multiline: true })}
          {field("Image URL", "image_url", {
            keyboard: "url",
            placeholder: "https://...",
          })}
        </>
      )}

      {/* Location */}
      {sectionHeader("Location")}
      {sectionCard(
        <>
          {field("City", "city")}
          {field("Address", "address")}
        </>
      )}

      {/* Contact */}
      {sectionHeader("Contact")}
      {sectionCard(
        <>
          {field("Phone", "phone")}
          {field("Email", "email", { keyboard: "email-address" })}
          {field("Website", "website", {
            keyboard: "url",
            placeholder: "https://...",
          })}
        </>
      )}

      {/* Programs & Students */}
      {sectionHeader("Programs & Students")}
      {sectionCard(
        <>
          {field("Programs (comma-separated)", "programs", {
            placeholder: "تحفيظ القرآن, العلوم الشرعية, ...",
          })}
          {field("Age Range", "age_range", { placeholder: "6 - 18 سنة" })}
          {field("Student Count", "student_count", { keyboard: "numeric" })}

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Gender
            </Text>
            <View style={styles.chipRow}>
              {GENDER_OPTIONS.map((g) =>
                chip(g.label, form.gender === g.value, () =>
                  setForm((f) => ({ ...f, gender: g.value })), g.icon
                )
              )}
            </View>
          </View>
        </>
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
            <Text style={styles.saveButtonText}>Save</Text>
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
                Remove School
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
