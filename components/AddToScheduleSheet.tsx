import { CATEGORIES } from "@/constants/categories";
import { Activity } from "@/constants/mockData";
import { BorderRadius, Colors, Fonts, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useMosquesStore } from "@/lib/stores/mosquesStore";
import { useScheduleStore } from "@/lib/stores/scheduleStore";
import { ScheduledEvent } from "@/lib/types/schedule";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AddToScheduleSheetProps {
  visible: boolean;
  activity: Activity | null;
  onClose: () => void;
}

// Offset options in minutes (negative = before, 0 = at event time, positive = after)
const OFFSET_OPTIONS = [-60, -30, -15, -10, -5, 0, 5, 10, 15, 30];

function offsetLabel(offset: number): string {
  if (offset === 0) return "في وقت الحدث";
  const abs = Math.abs(offset);
  const unit = abs >= 60 ? `${abs / 60} ساعة` : `${abs} د`;
  return offset < 0 ? `قبل ${unit}` : `بعد ${unit}`;
}

/** Parse "HH:mm" and apply an offset in minutes, returning "HH:mm" */
function applyOffset(time: string, offsetMinutes: number): string {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length < 2) return time;

  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);

  if (isNaN(h) || isNaN(m)) return time;

  let total = h * 60 + m + offsetMinutes;
  if (total < 0) total += 24 * 60;
  total = total % (24 * 60);
  const rh = Math.floor(total / 60);
  const rm = total % 60;
  return `${String(rh).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
}

export function AddToScheduleSheet({
  visible,
  activity,
  onClose,
}: AddToScheduleSheetProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const addEvent = useScheduleStore((s) => s.addEvent);
  const mosques = useMosquesStore((s) => s.mosques);
  const { t } = useTranslation();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedOffset, setSelectedOffset] = useState(0);

  // Cache activity to prevent layout jumping when the sheet is animating closed
  // and the parent simultaneously sets activity to null.
  const [cachedActivity, setCachedActivity] = useState<Activity | null>(
    activity,
  );

  useEffect(() => {
    if (activity) {
      setCachedActivity(activity);
      setSelectedOffset(0); // Optional: Reset offset whenever a new activity is opened
    }
  }, [activity]);

  // Sync parent's "visible" state to the bottom sheet's imperative methods
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSave = useCallback(() => {
    const targetActivity = activity || cachedActivity;
    if (!targetActivity) return;

    const mosque = targetActivity.mosqueId
      ? mosques.find((m) => m.id === targetActivity.mosqueId)
      : undefined;

    const categoryLabel = CATEGORIES[targetActivity.categoryId]?.label;
    const translatedCategory = categoryLabel ? t(categoryLabel) : undefined;

    let event: ScheduledEvent;

    if (targetActivity.timeAnchor === "prayer" && targetActivity.prayerId) {
      event = {
        id: `sch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        eventId: targetActivity.id,
        title: targetActivity.title,
        categoryId: targetActivity.categoryId,
        categoryName: translatedCategory,
        mosqueName: mosque ? mosque.name : targetActivity.mosqueName,
        mapsUrl: mosque ? mosque.mapsUrl : undefined,
        createdAt: new Date().toISOString(),
        anchor: "prayer",
        prayerId: targetActivity.prayerId as any,
        offsetMinutes: selectedOffset,
      };
    } else {
      const resolvedTime = applyOffset(
        targetActivity.startTime,
        selectedOffset,
      );
      console.log(targetActivity, "mewa");
      console.log("resolvedTime", resolvedTime);
      event = {
        id: `sch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        eventId: targetActivity.id,
        title: targetActivity.title,
        categoryId: targetActivity.categoryId,
        categoryName: translatedCategory,
        mosqueName: mosque ? mosque.name : targetActivity.mosqueName,
        mapsUrl: mosque ? mosque.mapsUrl : undefined,
        createdAt: new Date().toISOString(),
        anchor: "fixed",
        time: resolvedTime || targetActivity.startTime, // always store them as string
      };
    }

    addEvent(event);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }, [activity, cachedActivity, selectedOffset, addEvent, onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  const displayActivity = activity || cachedActivity;

  // Render a hidden, empty sheet if nothing is loaded to prevent hook/render issues
  if (!displayActivity) {
    return (
      <BottomSheet ref={bottomSheetRef} index={-1}>
        <BottomSheetView>
          <View />
        </BottomSheetView>
      </BottomSheet>
    );
  }
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.card }}
      handleIndicatorStyle={{ backgroundColor: theme.border }}
    >
      <BottomSheetView
        style={{ paddingBottom: Platform.OS === "ios" ? 34 : 20 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            إضافة للجدول
          </Text>
        </View>

        {/* Activity preview with time */}
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
            {displayActivity.title}
          </Text>
          <View style={styles.previewTimeRow}>
            <Ionicons name="time-outline" size={14} color={theme.primary} />
            <Text style={[styles.previewTime, { color: theme.primary }]}>
              {displayActivity.startTime}
            </Text>
          </View>
        </View>

        {/* Offset label */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          التنبيه
        </Text>

        {/* Offset chips */}
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

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.8}
          style={[styles.saveBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.saveBtnText}>حفظ في الجدول</Text>
          <Ionicons name="bookmark" size={18} color="#fff" />
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
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
  previewTimeRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  previewTime: {
    fontSize: 14,
    fontFamily: Fonts.mdsans,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: Fonts.mdsans,
    textAlign: "right",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  offsetGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
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
