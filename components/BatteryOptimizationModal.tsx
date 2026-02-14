import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Dimensions,
} from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Fonts } from "@/constants/fonts";
import { useTheme } from "@/context/ThemeContext";

const BATTERY_OPT_PROMPTED_KEY = "@masjidie/battery_opt_prompted";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function BatteryOptimizationModal() {
  const [visible, setVisible] = useState(false);
  const { theme } = useTheme();
  const colors = Colors[theme];

  useEffect(() => {
    if (Platform.OS !== "android") return;

    (async () => {
      const prompted = await AsyncStorage.getItem(BATTERY_OPT_PROMPTED_KEY);
      if (prompted !== "true") {
        // Small delay so the app loads fully before showing
        setTimeout(() => setVisible(true), 1500);
      }
    })();
  }, []);

  const handleAllow = async () => {
    setVisible(false);
    await AsyncStorage.setItem(BATTERY_OPT_PROMPTED_KEY, "true");

    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
        { data: "package:com.masjidie2.app" },
      );
    } catch {
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS,
        );
      } catch {
        Linking.openSettings();
      }
    }
  };

  const handleLater = async () => {
    setVisible(false);
    // Don't mark as prompted — will ask again next launch
  };

  if (Platform.OS !== "android") return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleLater}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* ── Icon badge ── */}
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor:
                  theme === "dark"
                    ? "rgba(9, 181, 115, 0.15)"
                    : "rgba(0, 141, 100, 0.1)",
              },
            ]}
          >
            <Text style={styles.iconEmoji}>🔋</Text>
          </View>

          {/* ── Title ── */}
          <Text style={[styles.title, { color: colors.text }]}>
            إعداد مهم للأذان
          </Text>

          {/* ── Subtitle ── */}
          <Text style={[styles.subtitle, { color: colors.primary }]}>
            Important Alarm Setting
          </Text>

          {/* ── Divider ── */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* ── Body text ── */}
          <Text style={[styles.bodyAr, { color: colors.text }]}>
            لضمان عمل الأذان بشكل موثوق، يرجى السماح للتطبيق بالعمل بدون قيود
            البطارية.
          </Text>
          <Text style={[styles.bodyEn, { color: colors.textSecondary }]}>
            To ensure the adhan alarm works reliably, please allow Masjidie to
            run without battery restrictions.
          </Text>

          {/* ── Info pill ── */}
          <View
            style={[
              styles.infoPill,
              {
                backgroundColor:
                  theme === "dark"
                    ? "rgba(226, 174, 26, 0.12)"
                    : "rgba(226, 174, 26, 0.1)",
              },
            ]}
          >
            <Text style={[styles.infoPillText, { color: colors.accent }]}>
              ⚡ يتطلب نقرة واحدة فقط — One tap only
            </Text>
          </View>

          {/* ── Buttons ── */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.btnSecondary, { borderColor: colors.border }]}
              onPress={handleLater}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.btnSecondaryText,
                  { color: colors.textSecondary },
                ]}
              >
                لاحقاً
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
              onPress={handleAllow}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>✓ السماح</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  card: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
    maxWidth: 380,
    borderRadius: BorderRadius.lg + 4, // 20
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconEmoji: {
    fontSize: 30,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.bdsans,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  divider: {
    width: 48,
    height: 3,
    borderRadius: 2,
    marginBottom: Spacing.md,
  },
  bodyAr: {
    fontSize: 15,
    fontFamily: Fonts.rsans,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  bodyEn: {
    fontSize: 13,
    fontFamily: Fonts.rsans,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  infoPill: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoPillText: {
    fontSize: 12,
    fontFamily: Fonts.mdsans,
    textAlign: "center",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: Spacing.sm + 4,
    width: "100%",
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: "center",
  },
  btnSecondaryText: {
    fontSize: 15,
    fontFamily: Fonts.mdsans,
  },
  btnPrimary: {
    flex: 1.4,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  btnPrimaryText: {
    fontSize: 15,
    fontFamily: Fonts.bdsans,
    color: "#FFFFFF",
  },
});
