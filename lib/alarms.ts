import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// ─── Constants ───────────────────────────────────────────────────────────────
const ALARM_CHANNEL_ID = "adhan_alarm";
const ADHAN_SOUND_FILE = "adahnsounda.mp3";

// ─── Notification Channel (Android) ─────────────────────────────────────────
/**
 * Creates an Android notification channel configured for alarm-level audio.
 * Uses ALARM audio usage so the sound plays at alarm volume (independent of
 * notification/ringer volume) and bypasses Do-Not-Disturb where supported.
 */
export async function setupAlarmChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: "Adhan Alarm",
    description: "Prayer time adhan alarm",
    importance: Notifications.AndroidImportance.MAX,
    sound: ADHAN_SOUND_FILE,
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
  });
}

// ─── Permissions ─────────────────────────────────────────────────────────────
/**
 * Requests notification permissions from the user.
 * Returns `true` if permissions were granted.
 */
export async function requestAlarmPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── Scheduling ──────────────────────────────────────────────────────────────
/**
 * Schedules a daily repeating alarm at the given hour & minute.
 * Cancels all previously scheduled alarms before setting the new one.
 *
 * @param hour   0–23, defaults to 15 (3:00 PM)
 * @param minute 0–59, defaults to 0
 */
export async function scheduleAdhanAlarm(
  hour: number = 15,
  minute: number = 0,
): Promise<string> {
  // Clear any existing scheduled alarms
  await Notifications.cancelAllScheduledNotificationsAsync();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🕌 وقت الصلاة",
      body: "حان وقت الصلاة",
      sound: ADHAN_SOUND_FILE,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      seconds: 5, // Set the delay in seconds
      repeats: false, // Set to false so it only fires once
      channelId: ALARM_CHANNEL_ID,
    },
  });

  /**
   * 
     const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🕌 وقت الصلاة",
      body: "حان وقت الصلاة",
      sound: ADHAN_SOUND_FILE,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: ALARM_CHANNEL_ID,
    },
  });
   * 
   */

  console.log(
    `[Alarms] Adhan alarm scheduled at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} — id: ${id}`,
  );
  return id;
}

// ─── Initializer ─────────────────────────────────────────────────────────────
/**
 * Full initialization: permissions → channel → schedule.
 * Call once at app startup (e.g. in _layout.tsx).
 * Battery optimization prompt is handled by BatteryOptimizationModal component.
 */
export async function initializeAlarms(): Promise<void> {
  const granted = await requestAlarmPermissions();
  if (!granted) {
    console.warn(
      "[Alarms] Notification permissions not granted — skipping alarm setup",
    );
    return;
  }

  await setupAlarmChannel();
  await scheduleAdhanAlarm(15, 0); // 3:00 PM — placeholder until prayer times are set
}
