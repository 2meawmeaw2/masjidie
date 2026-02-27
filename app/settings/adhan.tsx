import AnimatedSettingRow from "@/components/settings/AnimatedSettingRow";
import ScreenHeader from "@/components/settings/Header";
import { BorderRadius, Colors, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { MethodKey, PrayerName, useAdhanStore } from "@/lib/stores/adhanStore";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Portal } from "@gorhom/portal";
import React, { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const PRAYERS: { name: PrayerName; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: "fajr", icon: "sunny" },
  { name: "dhuhr", icon: "time" },
  { name: "asr", icon: "time" },
  { name: "maghrib", icon: "moon" },
  { name: "isha", icon: "time" },
];

const METHODS: { key: MethodKey; labelKey: string }[] = [
  { key: "algerian", labelKey: "adhan.algerian" },
  { key: "muslimWorldLeague", labelKey: "adhan.muslimWorldLeague" },
  { key: "egyptian", labelKey: "adhan.egyptian" },
  { key: "ummAlQura", labelKey: "adhan.ummAlQura" },
  { key: "northAmerica", labelKey: "adhan.northAmerica" },
  { key: "karachi", labelKey: "adhan.karachi" },
];

export default function AdhanScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["45%"], []);

  const {
    todayTimes,
    preferences: adhanPrefs,
    togglePrayer,
    setCalculationMethod,
  } = useAdhanStore();

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const handleSelectMethod = (key: MethodKey) => {
    setCalculationMethod(key);
    bottomSheetRef.current?.close();
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="الاذان" />

        {/* Prayer Toggles */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            {t("adhan.title").toUpperCase()}
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {PRAYERS.map((prayer, index) => {
              const timeEntry = todayTimes.find(
                (te) => te.name === prayer.name,
              );
              const timeStr = timeEntry
                ? timeEntry.time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--";
              return (
                <AnimatedSettingRow
                  key={prayer.name}
                  icon={prayer.icon}
                  title={t(`adhan.${prayer.name}`)}
                  description={timeStr}
                  index={index}
                  isLast={index === PRAYERS.length - 1}
                  rightElement={
                    <Switch
                      value={adhanPrefs.enabledPrayers[prayer.name]}
                      onValueChange={() => togglePrayer(prayer.name)}
                      trackColor={{ false: "#767577", true: colors.primary }}
                      thumbColor="#f4f3f4"
                    />
                  }
                />
              );
            })}
          </View>
        </View>

        {/* Calculation Method */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            {t("adhan.calculationMethod").toUpperCase()}
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <AnimatedSettingRow
              icon="calculator"
              title={t("adhan.calculationMethod")}
              description={t(`adhan.${adhanPrefs.calculationMethod}`)}
              index={5}
              isLast
              onPress={() => bottomSheetRef.current?.expand()}
            />
          </View>
        </View>
      </ScrollView>

      {/* Method Picker Bottom Sheet */}
      <Portal>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: colors.card }}
          handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {t("adhan.calculationMethod")}
            </Text>
            {METHODS.map((method, index) => {
              const isSelected = method.key === adhanPrefs.calculationMethod;
              return (
                <Animated.View
                  key={method.key}
                  entering={FadeInDown.delay(120 + index * 50)
                    .springify()
                    .damping(14)}
                >
                  <TouchableOpacity
                    style={[
                      styles.methodItem,
                      { borderBottomColor: colors.border },
                      index === METHODS.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => handleSelectMethod(method.key)}
                  >
                    <Text
                      style={[
                        styles.methodLabel,
                        { color: isSelected ? colors.primary : colors.text },
                      ]}
                    >
                      {t(method.labelKey)}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={22}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </BottomSheetView>
        </BottomSheet>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: Fonts.mdsans,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    paddingHorizontal: Spacing.xs,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    overflow: "hidden",
  },
  sheetContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: Fonts.sbsans,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  methodLabel: {
    fontSize: 15,
    fontFamily: Fonts.mdsans,
  },
});
