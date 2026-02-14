import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  BorderRadius,
  Fonts,
  Shadows,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useScheduleStore } from "@/lib/stores/scheduleStore";
import {
  PrayerId,
  PRAYER_IDS,
  PRAYER_LABELS,
  ScheduledEvent,
} from "@/lib/types/schedule";
import { Activity } from "@/constants/mockData";
import * as Haptics from "expo-haptics";

interface AddToScheduleSheetProps {
  visible: boolean;
  activity: Activity | null;
  onClose: () => void;
}

type AnchorMode = "fixed" | "prayer";

// ── Simple time-picker wheel ──────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

const OFFSET_OPTIONS = [-60, -30, -15, 0, 15, 30, 60];

export function AddToScheduleSheet({
  visible,
  activity,
  onClose,
}: AddToScheduleSheetProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const addEvent = useScheduleStore((s) => s.addEvent);

  // ── Local state ──────────────────────────────
  const [anchorMode, setAnchorMode] = useState<AnchorMode>("fixed");
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerId>("dhuhr");
  const [selectedOffset, setSelectedOffset] = useState(0);

  const handleSave = useCallback(() => {
    if (!activity) return;

    const base = {
      id: `sch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      eventId: activity.id,
      title: activity.title,
      categoryId: activity.categoryId,
      createdAt: new Date().toISOString(),
    };

    const event: ScheduledEvent =
      anchorMode === "fixed"
        ? {
            ...base,
            anchor: "fixed",
            time: `${selectedHour}:${selectedMinute}`,
          }
        : {
            ...base,
            anchor: "prayer",
            prayerId: selectedPrayer,
            offsetMinutes: selectedOffset,
          };

    addEvent(event);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }, [
    activity,
    anchorMode,
    selectedHour,
    selectedMinute,
    selectedPrayer,
    selectedOffset,
    addEvent,
    onClose,
  ]);

  if (!activity) return null;

  const offsetLabel = (offset: number) => {
    if (offset === 0) return "عند الأذان";
    const abs = Math.abs(offset);
    return offset > 0 ? `بعد ${abs} د` : `قبل ${abs} د`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              إضافة للجدول
            </Text>
          </View>

          {/* Activity preview */}
          <View
            style={[
              styles.preview,
              {
                backgroundColor: isDark
                  ? theme.primary + "10"
                  : theme.primary + "08",
                borderColor: theme.primary + "20",
              },
            ]}
          >
            <Text style={[styles.previewTitle, { color: theme.text }]}>
              {activity.title}
            </Text>
          </View>

          {/* Anchor mode toggle */}
          <View
            style={[
              styles.segmentedControl,
              { backgroundColor: isDark ? theme.background : "#F1F5F9" },
            ]}
          >
            {(["fixed", "prayer"] as AnchorMode[]).map((mode) => {
              const active = anchorMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    setAnchorMode(mode);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.segment,
                    active && {
                      backgroundColor: theme.card,
                      ...(!isDark ? Shadows.light : {}),
                    },
                  ]}
                >
                  <Ionicons
                    name={mode === "fixed" ? "time-outline" : "moon-outline"}
                    size={16}
                    color={active ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.segmentLabel,
                      {
                        color: active ? theme.primary : theme.textSecondary,
                        fontFamily: active ? Fonts.bdsans : Fonts.rsans,
                      },
                    ]}
                  >
                    {mode === "fixed" ? "وقت محدد" : "صلاة"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Content based on mode */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {anchorMode === "fixed" ? (
              <View style={styles.timePickerContainer}>
                <Text
                  style={[styles.sectionLabel, { color: theme.textSecondary }]}
                >
                  اختر الوقت
                </Text>
                <View style={styles.timePicker}>
                  {/* Minutes */}
                  <View style={styles.timeGroup}>
                    <Text
                      style={[styles.timeLabel, { color: theme.textSecondary }]}
                    >
                      الدقيقة
                    </Text>
                    <ScrollView
                      style={styles.timeScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {MINUTES.map((m) => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => {
                            setSelectedMinute(m);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.timeChip,
                            selectedMinute === m && {
                              backgroundColor: theme.primary + "18",
                              borderColor: theme.primary,
                            },
                            selectedMinute !== m && {
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              {
                                color:
                                  selectedMinute === m
                                    ? theme.primary
                                    : theme.text,
                              },
                            ]}
                          >
                            {m}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <Text style={[styles.colon, { color: theme.text }]}>:</Text>

                  {/* Hours */}
                  <View style={styles.timeGroup}>
                    <Text
                      style={[styles.timeLabel, { color: theme.textSecondary }]}
                    >
                      الساعة
                    </Text>
                    <ScrollView
                      style={styles.timeScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {HOURS.map((h) => (
                        <TouchableOpacity
                          key={h}
                          onPress={() => {
                            setSelectedHour(h);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.timeChip,
                            selectedHour === h && {
                              backgroundColor: theme.primary + "18",
                              borderColor: theme.primary,
                            },
                            selectedHour !== h && {
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              {
                                color:
                                  selectedHour === h
                                    ? theme.primary
                                    : theme.text,
                              },
                            ]}
                          >
                            {h}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.prayerContainer}>
                {/* Prayer selector */}
                <Text
                  style={[styles.sectionLabel, { color: theme.textSecondary }]}
                >
                  اختر الصلاة
                </Text>
                <View style={styles.prayerGrid}>
                  {PRAYER_IDS.map((id) => {
                    const active = selectedPrayer === id;
                    return (
                      <TouchableOpacity
                        key={id}
                        onPress={() => {
                          setSelectedPrayer(id);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.prayerChip,
                          {
                            backgroundColor: active
                              ? theme.accent + "20"
                              : "transparent",
                            borderColor: active ? theme.accent : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.prayerChipText,
                            {
                              color: active ? theme.accent : theme.text,
                              fontFamily: active ? Fonts.bdsans : Fonts.rsans,
                            },
                          ]}
                        >
                          {PRAYER_LABELS[id]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Offset selector */}
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: theme.textSecondary, marginTop: Spacing.lg },
                  ]}
                >
                  التوقيت النسبي
                </Text>
                <View style={styles.offsetGrid}>
                  {OFFSET_OPTIONS.map((offset) => {
                    const active = selectedOffset === offset;
                    return (
                      <TouchableOpacity
                        key={offset}
                        onPress={() => {
                          setSelectedOffset(offset);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.offsetChip,
                          {
                            backgroundColor: active
                              ? theme.primary + "18"
                              : "transparent",
                            borderColor: active ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.offsetChipText,
                            {
                              color: active ? theme.primary : theme.text,
                              fontFamily: active ? Fonts.mdsans : Fonts.rsans,
                            },
                          ]}
                        >
                          {offsetLabel(offset)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.saveBtnText}>حفظ في الجدول</Text>
            <Ionicons name="bookmark" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Fonts.bdsans,
  },
  preview: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: Fonts.mdsans,
    textAlign: "right",
  },
  segmentedControl: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  segment: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
  },
  segmentLabel: {
    fontSize: 14,
  },
  body: {
    paddingHorizontal: Spacing.lg,
    maxHeight: 300,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
    textAlign: "right",
    marginBottom: Spacing.sm,
  },
  // ── Fixed time picker ──────
  timePickerContainer: {},
  timePicker: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: Spacing.md,
  },
  timeGroup: {
    alignItems: "center",
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: Fonts.rsans,
    marginBottom: Spacing.xs,
  },
  timeScroll: {
    maxHeight: 180,
  },
  timeChip: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    alignItems: "center",
    minWidth: 56,
  },
  timeChipText: {
    fontSize: 18,
    fontFamily: Fonts.mdsans,
  },
  colon: {
    fontSize: 28,
    fontFamily: Fonts.bdsans,
    marginTop: 28,
  },
  // ── Prayer selector ────────
  prayerContainer: {},
  prayerGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  prayerChip: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md + 2,
  },
  prayerChipText: {
    fontSize: 15,
  },
  offsetGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  offsetChip: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
  },
  offsetChipText: {
    fontSize: 13,
  },
  // ── Save button ────────────
  saveBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: Fonts.bdsans,
  },
});
