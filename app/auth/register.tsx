import { Colors, Fonts } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  extractCoordsFromUrl,
  resolveGoogleMapsLink,
} from "@/lib/stores/mosquesStore";
import { useRequestsStore } from "@/lib/stores/requestsStore";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type RegistrationType = "mosque" | "school";

export default function RegisterScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { signUp, isLoading, error, session } = useAuthStore();

  const [type, setType] = useState<RegistrationType>("mosque");
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const [toggleWidth, setToggleWidth] = useState(0);

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: type === "mosque" ? 0 : -1,
      useNativeDriver: true,
      bounciness: 2,
      speed: 12,
    }).start();
  }, [type]);

  // Account fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Mosque fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [imam, setImam] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState("");

  const addService = () => {
    const trimmed = serviceInput.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices((prev) => [...prev, trimmed]);
      setServiceInput("");
    }
  };

  const removeService = (service: string) => {
    setServices((prev) => prev.filter((s) => s !== service));
  };

  // School fields
  const [phone, setPhone] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [programs, setPrograms] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "mixed">("mixed");

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "صلاحية مطلوبة",
        "يرجى السماح بالوصول إلى مكتبة الصور لرفع صورة.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (recordId: string): Promise<string> => {
    if (!imageUri) return "";

    setUploadingImage(true);
    try {
      const ext = imageUri.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${type}s/${recordId}.${ext}`;

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, arrayBuffer, {
          contentType: blob.type || `image/${ext}`,
          upsert: true,
        });

      if (uploadError) {
        console.warn("Image upload failed:", uploadError.message);
        return "";
      }

      const { data } = supabase.storage.from("images").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e) {
      console.warn("Image upload error:", e);
      return "";
    } finally {
      setUploadingImage(false);
    }
  };

  React.useEffect(() => {
    if (session) {
      router.replace("/admin");
    }
  }, [session]);

  const validate = (): boolean => {
    setValidationError(null);

    if (!email.trim()) {
      setValidationError("البريد الإلكتروني مطلوب");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError("يرجى إدخال بريد إلكتروني صالح");
      return false;
    }
    if (!password || password.length < 6) {
      setValidationError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError("كلمتا المرور غير متطابقتين");
      return false;
    }
    if (!name.trim()) {
      setValidationError("الاسم مطلوب");
      return false;
    }
    if (!address.trim()) {
      setValidationError("العنوان مطلوب");
      return false;
    }
    if (!city.trim()) {
      setValidationError("المدينة مطلوبة");
      return false;
    }
    return true;
  };

  const resolveCoordinatesFromMapsUrl = async (
    url: string,
  ): Promise<{ latitude: number; longitude: number }> => {
    if (!url.trim()) return { latitude: 0, longitude: 0 };

    try {
      let finalUrl = url.trim();

      if (
        finalUrl.includes("goo.gl") ||
        finalUrl.includes("app.goo.gl") ||
        finalUrl.includes("share.google")
      ) {
        finalUrl = await resolveGoogleMapsLink(finalUrl);
      }

      const coords = extractCoordsFromUrl(finalUrl);
      if (coords) return coords;
    } catch (err) {
      console.warn("Failed to resolve coordinates from maps URL:", err);
    }

    return { latitude: 0, longitude: 0 };
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const recordId = type === "mosque" ? `m_${Date.now()}` : `s_${Date.now()}`;

    const metadata: Record<string, string> = {
      mosque_id: recordId,
      role: type,
    };

    const success = await signUp(email.trim(), password, metadata);
    if (!success) return;

    const imageUrl = await uploadImage(recordId);
    const { submitRequest } = useRequestsStore.getState();

    if (type === "mosque") {
      const coords = await resolveCoordinatesFromMapsUrl(mapsUrl);

      const payload = {
        id: recordId,
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        imam: imam.trim() || null,
        capacity: capacity.trim() || null,
        description: description.trim() || null,
        maps_url: mapsUrl.trim() || null,
        services: services.length > 0 ? services : null,
        image_url: imageUrl,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      const ok = await submitRequest(
        "register_mosque",
        "mosques",
        recordId,
        payload,
      );
      if (!ok) {
        Alert.alert("خطأ", "فشل إرسال طلب التسجيل.");
        return;
      }
    } else {
      const programList = programs
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        id: recordId,
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        description: description.trim() || null,
        phone: phone.trim() || null,
        email: schoolEmail.trim() || null,
        programs: programList.length > 0 ? programList : null,
        age_range: ageRange.trim() || null,
        gender: gender,
        image_url: imageUrl,
        latitude: 0,
        longitude: 0,
      };
      const ok = await submitRequest(
        "register_school",
        "quran_schools",
        recordId,
        payload,
      );
      if (!ok) {
        Alert.alert("خطأ", "فشل إرسال طلب التسجيل.");
        return;
      }
    }

    Alert.alert(
      "تم إرسال التسجيل",
      "تم إرسال تسجيلك للمراجعة. سيتم إشعارك عند الموافقة عليه.",
      [{ text: "حسناً" }],
    );
  };

  const displayError = validationError || error;

  const GENDER_LABELS: Record<"male" | "female" | "mixed", string> = {
    male: "ذكور",
    female: "إناث",
    mixed: "مختلط",
  };

  const renderInput = (
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string,
    value: string,
    onChangeText: (t: string) => void,
    options?: {
      multiline?: boolean;
      keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
      autoCapitalize?: "none" | "sentences" | "words";
    },
  ) => (
    <View
      style={[
        styles.inputWrap,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
        options?.multiline && { minHeight: 80, alignItems: "flex-start" },
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={colors.textSecondary}
        style={[styles.inputIcon, options?.multiline && { marginTop: 14 }]}
      />
      <TextInput
        style={[
          styles.input,
          { color: colors.text },
          options?.multiline && { textAlignVertical: "top", paddingTop: 12 },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        multiline={options?.multiline}
        keyboardType={options?.keyboardType}
        autoCapitalize={options?.autoCapitalize ?? "sentences"}
        textAlign="right"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.brandArea}>
          <View
            style={[styles.iconCircle, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="business" size={32} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>تسجيل جديد</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            انضم إلى منصة مسجدي
          </Text>
        </View>

        {/* Type Toggle */}
        <View
          style={[
            styles.toggleContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onLayout={(e) => setToggleWidth(e.nativeEvent.layout.width)}
        >
          {toggleWidth > 0 && (
            <Animated.View
              style={[
                styles.slidingBackground,
                {
                  backgroundColor: colors.primary,
                  width: (toggleWidth - 6) / 2,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (toggleWidth - 6) / 2],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}

          <TouchableOpacity
            style={[
              styles.toggleOption,
              { opacity: type === "mosque" ? 1 : 0.5 },
            ]}
            onPress={() => setType("mosque")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="home"
              size={18}
              color={type === "mosque" ? "#fff" : colors.textSecondary}
            />
            <Text
              style={[
                styles.toggleText,
                { color: type === "mosque" ? "#fff" : colors.text },
              ]}
            >
              مسجد
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleOption,
              { opacity: type === "school" ? 1 : 0.5 },
            ]}
            onPress={() => setType("school")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="school"
              size={18}
              color={type === "school" ? "#fff" : colors.textSecondary}
            />
            <Text
              style={[
                styles.toggleText,
                { color: type === "school" ? "#fff" : colors.text },
              ]}
            >
              مدرسة قرآنية
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Account Section */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            الحساب
          </Text>
          {renderInput("mail-outline", "البريد الإلكتروني", email, setEmail, {
            keyboardType: "email-address",
            autoCapitalize: "none",
          })}
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text, flex: 1 }]}
              placeholder="كلمة المرور (6 أحرف على الأقل)"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textAlign="right"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {renderInput(
            "lock-closed-outline",
            "تأكيد كلمة المرور",
            confirmPassword,
            setConfirmPassword,
            { autoCapitalize: "none" },
          )}

          {/* Details Section */}
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textSecondary, marginTop: 12 },
            ]}
          >
            {type === "mosque" ? "معلومات المسجد" : "معلومات المدرسة"}
          </Text>

          {/* Image Picker */}
          <TouchableOpacity
            style={[
              styles.imagePicker,
              {
                backgroundColor: colors.background,
                borderColor: imageUri ? colors.primary : colors.border,
              },
            ]}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="camera-outline"
                  size={32}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.imagePlaceholderText,
                    { color: colors.textSecondary },
                  ]}
                >
                  اضغط لإضافة صورة
                </Text>
              </View>
            )}
            {imageUri && (
              <View
                style={[
                  styles.imageChangeOverlay,
                  { backgroundColor: "rgba(0,0,0,0.4)" },
                ]}
              >
                <Ionicons name="camera-outline" size={20} color="#fff" />
                <Text style={styles.imageChangeText}>تغيير</Text>
              </View>
            )}
          </TouchableOpacity>

          {renderInput("text-outline", "الاسم *", name, setName, {
            autoCapitalize: "words",
          })}
          {renderInput("location-outline", "العنوان *", address, setAddress)}
          {renderInput("business-outline", "المدينة *", city, setCity, {
            autoCapitalize: "words",
          })}
          {renderInput(
            "document-text-outline",
            "الوصف",
            description,
            setDescription,
            { multiline: true },
          )}

          {type === "mosque" ? (
            <>
              {renderInput("person-outline", "اسم الإمام", imam, setImam, {
                autoCapitalize: "words",
              })}
              {renderInput("people-outline", "السعة", capacity, setCapacity)}
              {renderInput(
                "map-outline",
                "رابط خرائط Google",
                mapsUrl,
                setMapsUrl,
                { autoCapitalize: "none" },
              )}

              {/* Services Input */}
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                الخدمات
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="construct-outline"
                  size={18}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text, flex: 1 }]}
                  placeholder="أضف خدمة (مثال: صلاة الجمعة)"
                  placeholderTextColor={colors.textSecondary}
                  value={serviceInput}
                  onChangeText={setServiceInput}
                  onSubmitEditing={addService}
                  returnKeyType="done"
                  textAlign="right"
                />
                <TouchableOpacity
                  onPress={addService}
                  style={styles.addServiceBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="add-circle"
                    size={24}
                    color={serviceInput.trim() ? colors.primary : colors.border}
                  />
                </TouchableOpacity>
              </View>
              {services.length > 0 && (
                <View style={styles.tagsContainer}>
                  {services.map((service) => (
                    <View
                      key={service}
                      style={[
                        styles.tag,
                        {
                          backgroundColor: colors.primary + "15",
                          borderColor: colors.primary + "30",
                        },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: colors.primary }]}>
                        {service}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeService(service)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              {renderInput("call-outline", "الهاتف", phone, setPhone, {
                keyboardType: "phone-pad",
              })}
              {renderInput(
                "mail-outline",
                "البريد الإلكتروني للتواصل",
                schoolEmail,
                setSchoolEmail,
                { keyboardType: "email-address", autoCapitalize: "none" },
              )}
              {renderInput(
                "book-outline",
                "البرامج (مفصولة بفاصلة)",
                programs,
                setPrograms,
              )}
              {renderInput(
                "calendar-outline",
                "الفئة العمرية (مثال: 6-18)",
                ageRange,
                setAgeRange,
              )}

              {/* Gender Selector */}
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                الجنس
              </Text>
              <View style={styles.genderRow}>
                {(["male", "female", "mixed"] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      {
                        borderColor:
                          gender === g ? colors.primary : colors.border,
                        backgroundColor:
                          gender === g ? colors.primary + "15" : "transparent",
                      },
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        {
                          color:
                            gender === g
                              ? colors.primary
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {GENDER_LABELS[g]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Error */}
          {displayError ? (
            <View
              style={[
                styles.errorRow,
                { backgroundColor: colors.error + "15" },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {displayError}
              </Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              (isLoading || uploadingImage) && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={isLoading || uploadingImage}
            activeOpacity={0.7}
          >
            {isLoading || uploadingImage ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.buttonText}>تسجيل</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Back to login link */}
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.linkText, { color: colors.textSecondary }]}>
            لديك حساب بالفعل؟{" "}
          </Text>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            تسجيل الدخول
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 8,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Brand
  brandArea: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bdsans,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.rsans,
    marginTop: 4,
  },

  // Toggle
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
    position: "relative",
  },
  slidingBackground: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 10,
  },
  toggleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },

  // Form card
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: Fonts.sbsans,
    letterSpacing: 0.5,
    marginBottom: -4,
    writingDirection: "rtl",
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
    marginBottom: -4,
    writingDirection: "rtl",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  inputIcon: {
    marginStart: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Fonts.rsans,
    writingDirection: "rtl",
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  // Image picker
  imagePicker: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    height: 160,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 13,
    fontFamily: Fonts.rsans,
  },
  imageChangeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  imageChangeText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },

  // Gender
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  genderText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },

  // Services tags
  addServiceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
  },

  // Error
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
    flex: 1,
    writingDirection: "rtl",
  },

  // Button
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontFamily: Fonts.bdsans,
    fontSize: 16,
  },

  // Link
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    fontFamily: Fonts.rsans,
  },
});
