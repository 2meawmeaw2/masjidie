import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useAdhanStore } from "@/lib/stores/adhanStore";

// ─── Constants ───────────────────────────────────────────────────────────────
const ALARM_CHANNEL_ID = "adhan_alarm";
const FAJR_CHANNEL_ID = "adhan_alarm_fajr";
const ADHAN_SOUND_FILE = "adahnsounda.mp3";
const FAJR_SOUND_FILE = "adahnsoundfajr.mp3";

// ─── Notification Channels (Android) ────────────────────────────────────────
export async function setupAlarmChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Promise.all([
    Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
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
    }),
    Notifications.setNotificationChannelAsync(FAJR_CHANNEL_ID, {
      name: "Fajr Adhan Alarm",
      description: "Fajr prayer adhan alarm",
      importance: Notifications.AndroidImportance.MAX,
      sound: FAJR_SOUND_FILE,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      },
    }),
  ]);
}

// ─── Permissions ─────────────────────────────────────────────────────────────
export async function requestAlarmPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── Initializer ─────────────────────────────────────────────────────────────
export async function initializeAlarms(): Promise<void> {
  const granted = await requestAlarmPermissions();
  if (!granted) {
    console.warn(
      "[Alarms] Notification permissions not granted — skipping alarm setup",
    );
    return;
  }

  await setupAlarmChannels();
  await useAdhanStore.getState().initialize();
}
