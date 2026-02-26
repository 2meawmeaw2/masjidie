import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore } from "@/lib/stores/authStore";
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
  const [toggleWidth, setToggleWidth] = useState(0); // <-- Add this to track container width
  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: type === "mosque" ? 0 : -1,
      useNativeDriver: true, // Hardware acceleration for smooth 60fps
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
        "Permission needed",
        "Please allow access to your photo library to upload an image.",
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

      // Convert blob to ArrayBuffer for Supabase upload
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
      setValidationError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError("Please enter a valid email");
      return false;
    }
    if (!password || password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return false;
    }
    if (!name.trim()) {
      setValidationError("Name is required");
      return false;
    }
    if (!address.trim()) {
      setValidationError("Address is required");
      return false;
    }
    if (!city.trim()) {
      setValidationError("City is required");
      return false;
    }
    return true;
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

    // Upload image if selected
    const imageUrl = await uploadImage(recordId);

    // Insert into the relevant table
    if (type === "mosque") {
      const { error: insertError } = await supabase.from("mosques").insert({
        id: recordId,
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        imam: imam.trim() || null,
        capacity: capacity.trim() || null,
        description: description.trim() || null,
        maps_url: mapsUrl.trim() || null,
        image_url: imageUrl,
        latitude: 0,
        longitude: 0,
      });
      if (insertError) {
        Alert.alert("Error", insertError.message);
        return;
      }
    } else {
      const programList = programs
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const { error: insertError } = await supabase
        .from("quran_schools")
        .insert({
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
        });
      if (insertError) {
        Alert.alert("Error", insertError.message);
        return;
      }
    }
    // Session listener in _layout will auto-navigate to /admin
  };

  const displayError = validationError || error;

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
          <Text style={[styles.title, { color: colors.text }]}>Register</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join the Masjidie platform
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
          {/* Animated Sliding Background */}
          {toggleWidth > 0 && (
            <Animated.View
              style={[
                styles.slidingBackground,
                {
                  backgroundColor: colors.primary,
                  width: (toggleWidth - 6) / 2, // 6px = 3px padding * 2
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
              {
                opacity: type === "mosque" ? 1 : 0.5,
              },
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
              Mosque
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleOption,
              {
                opacity: type === "school" ? 1 : 0.5,
              },
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
              Islamic School
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
            ACCOUNT
          </Text>
          {renderInput("mail-outline", "Email", email, setEmail, {
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
              placeholder="Password (min 6 characters)"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
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
            "Confirm password",
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
            {type === "mosque" ? "MOSQUE DETAILS" : "SCHOOL DETAILS"}
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
                  Tap to add a photo
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
                <Text style={styles.imageChangeText}>Change</Text>
              </View>
            )}
          </TouchableOpacity>

          {renderInput("text-outline", "Name *", name, setName, {
            autoCapitalize: "words",
          })}
          {renderInput("location-outline", "Address *", address, setAddress)}
          {renderInput("business-outline", "City *", city, setCity, {
            autoCapitalize: "words",
          })}
          {renderInput(
            "document-text-outline",
            "Description",
            description,
            setDescription,
            { multiline: true },
          )}

          {type === "mosque" ? (
            <>
              {renderInput("person-outline", "Imam name", imam, setImam, {
                autoCapitalize: "words",
              })}
              {renderInput("people-outline", "Capacity", capacity, setCapacity)}
              {renderInput(
                "map-outline",
                "Google Maps URL",
                mapsUrl,
                setMapsUrl,
                { autoCapitalize: "none" },
              )}
            </>
          ) : (
            <>
              {renderInput("call-outline", "Phone", phone, setPhone, {
                keyboardType: "phone-pad",
              })}
              {renderInput(
                "mail-outline",
                "Contact email",
                schoolEmail,
                setSchoolEmail,
                { keyboardType: "email-address", autoCapitalize: "none" },
              )}
              {renderInput(
                "book-outline",
                "Programs (comma-separated)",
                programs,
                setPrograms,
              )}
              {renderInput(
                "calendar-outline",
                "Age range (e.g. 6-18)",
                ageRange,
                setAgeRange,
              )}

              {/* Gender Selector */}
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Gender
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
                      {g.charAt(0).toUpperCase() + g.slice(1)}
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
                <Text style={styles.buttonText}>Register</Text>
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
            Already have an account?{" "}
          </Text>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Sign In
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
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
    fontFamily: "IBMPlexSansArabic-Bold",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic-Regular",
    marginTop: 4,
  },

  // Toggle
  // Toggle
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
    position: "relative", // <-- Important for the absolute background child
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
    zIndex: 1, // <-- Ensures touches pass through to the buttons over the background
  },
  toggleText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic-Medium",
  },

  // Form card
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic-Medium",
    letterSpacing: 1,
    marginBottom: -4,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic-Medium",
    marginBottom: -4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 15,
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
    fontFamily: "IBMPlexSansArabic-Regular",
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
    fontFamily: "IBMPlexSansArabic-Medium",
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
    fontFamily: "IBMPlexSansArabic-Medium",
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
    fontFamily: "IBMPlexSansArabic-Medium",
    flex: 1,
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
    fontFamily: "IBMPlexSansArabic-Bold",
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
    fontFamily: "IBMPlexSansArabic-Regular",
  },
});
