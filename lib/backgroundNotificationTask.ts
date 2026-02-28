import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  Madhab,
  PrayerTimes,
} from "adhan";
import i18n from "@/lib/i18n";
import type { ScheduledEvent } from "@/lib/types/schedule";
import type { MethodKey, PrayerName } from "@/lib/stores/adhanStore";

// ─── Constants ──────────────────────────────────────────────────────────────

export const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND_NOTIFICATION_RESCHEDULE";

const ADHAN_ID_PREFIX = "adhan-";
const EVENT_ID_PREFIX = "event-";
const ALARM_CHANNEL_ID = "adhan_alarm";
const FAJR_CHANNEL_ID = "adhan_alarm_fajr";
const EVENT_CHANNEL_ID = "event_reminder";
const ADHAN_SOUND = "adahnsounda.mp3";
const FAJR_SOUND = "adahnsoundfajr.mp3";
const PREFS_KEY = "@adhan_preferences";
const SCHEDULE_KEY = "@saved_schedule";
const LOCATION_KEY = "@user_location";

const DEFAULT_LAT = 36.75;
const DEFAULT_LON = 3.06;

const ALL_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

// ─── Helpers (self-contained to avoid circular deps with stores) ────────────

function getCalculationParams(method: MethodKey): CalculationParameters {
  let params: CalculationParameters;
  switch (method) {
    case "algerian":
      params = CalculationMethod.Other();
      params.fajrAngle = 18;
      params.ishaAngle = 17;
      params.madhab = Madhab.Shafi;
      break;
    case "muslimWorldLeague":
      params = CalculationMethod.MuslimWorldLeague();
      params.madhab = Madhab.Shafi;
      break;
    case "egyptian":
      params = CalculationMethod.Egyptian();
      params.madhab = Madhab.Shafi;
      break;
    case "ummAlQura":
      params = CalculationMethod.UmmAlQura();
      params.madhab = Madhab.Shafi;
      break;
    case "northAmerica":
      params = CalculationMethod.NorthAmerica();
      params.madhab = Madhab.Shafi;
      break;
    case "karachi":
      params = CalculationMethod.Karachi();
      params.madhab = Madhab.Shafi;
      break;
    default:
      params = CalculationMethod.Other();
      params.fajrAngle = 18;
      params.ishaAngle = 17;
      params.madhab = Madhab.Shafi;
  }
  return params;
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ─── Task Definition ────────────────────────────────────────────────────────

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    const prefsRaw = await AsyncStorage.getItem(PREFS_KEY);
    const prefs = prefsRaw
      ? JSON.parse(prefsRaw)
      : {
          enabledPrayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
          calculationMethod: "algerian" as MethodKey,
        };

    const locRaw = await AsyncStorage.getItem(LOCATION_KEY);
    let lat = DEFAULT_LAT;
    let lon = DEFAULT_LON;
    if (locRaw) {
      const loc = JSON.parse(locRaw);
      const parsedLat = parseFloat(loc.lat);
      const parsedLon = parseFloat(loc.lon);
      if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
        lat = parsedLat;
        lon = parsedLon;
      }
    }

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const now = new Date();

    const coords = new Coordinates(lat, lon);
    const params = getCalculationParams(prefs.calculationMethod);

    const todayPT = new PrayerTimes(coords, today, params);
    const tomorrowPT = new PrayerTimes(coords, tomorrow, params);

    const todayTimes = ALL_PRAYERS.map((name) => ({ name, time: todayPT[name] as Date }));
    const tomorrowTimes = ALL_PRAYERS.map((name) => ({ name, time: tomorrowPT[name] as Date }));

    // ── Reschedule adhan notifications ──
    const allNotifs = await Notifications.getAllScheduledNotificationsAsync();
    const adhanIds = allNotifs
      .filter((n) => n.identifier.startsWith(ADHAN_ID_PREFIX))
      .map((n) => n.identifier);
    await Promise.all(adhanIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

    const allTimes = [...todayTimes, ...tomorrowTimes];
    for (const entry of allTimes) {
      if (!prefs.enabledPrayers[entry.name]) continue;
      if (entry.time <= now) continue;

      const isFajr = entry.name === "fajr";
      const prayerLabel = i18n.t(`adhan.${entry.name}`);
      const identifier = `${ADHAN_ID_PREFIX}${entry.name}-${formatDateKey(entry.time)}`;

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: prayerLabel,
          body: i18n.t("adhan.notificationBody", { prayer: prayerLabel }),
          sound: isFajr ? FAJR_SOUND : ADHAN_SOUND,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: entry.time,
          channelId: isFajr ? FAJR_CHANNEL_ID : ALARM_CHANNEL_ID,
        },
      });
    }

    // ── Reschedule event notifications ──
    const eventNotifIds = allNotifs
      .filter((n) => n.identifier.startsWith(EVENT_ID_PREFIX))
      .map((n) => n.identifier);
    await Promise.all(eventNotifIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

    const scheduleRaw = await AsyncStorage.getItem(SCHEDULE_KEY);
    const events: ScheduledEvent[] = scheduleRaw ? JSON.parse(scheduleRaw) : [];

    for (const event of events) {
      let targetTime: Date | null = null;

      if (event.anchor === "fixed") {
        const [h, m] = event.time.split(":").map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          const target = new Date();
          target.setHours(h, m, 0, 0);
          if (target <= now) target.setDate(target.getDate() + 1);
          targetTime = target;
        }
      } else {
        const todayPrayer = todayTimes.find((p) => p.name === event.prayerId);
        const tomorrowPrayer = tomorrowTimes.find((p) => p.name === event.prayerId);

        if (todayPrayer) {
          const t = new Date(todayPrayer.time.getTime() + event.offsetMinutes * 60_000);
          if (t > now) targetTime = t;
        }
        if (!targetTime && tomorrowPrayer) {
          const t = new Date(tomorrowPrayer.time.getTime() + event.offsetMinutes * 60_000);
          if (t > now) targetTime = t;
        }
      }

      if (targetTime) {
        await Notifications.scheduleNotificationAsync({
          identifier: `${EVENT_ID_PREFIX}${event.id}`,
          content: {
            title: i18n.t("notifications.eventReminderTitle"),
            body: i18n.t("notifications.eventReminderBody", { title: event.title }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: targetTime,
            channelId: EVENT_CHANNEL_ID,
          },
        });
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.error("[BackgroundTask] Failed to reschedule notifications:", e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background fetch task.
 * Call once at app startup (after task is defined above).
 */
export async function registerBackgroundNotificationTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (isRegistered) return;

    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 60 * 60, // ~1 hour (OS decides actual frequency)
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (e) {
    console.error("[BackgroundTask] Failed to register:", e);
  }
}
