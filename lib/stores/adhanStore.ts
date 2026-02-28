import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  PrayerTimes,
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  Prayer,
  Madhab,
} from "adhan";
import i18n from "@/lib/i18n";
import { getSavedLocation } from "@/lib/storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type MethodKey =
  | "algerian"
  | "muslimWorldLeague"
  | "egyptian"
  | "ummAlQura"
  | "northAmerica"
  | "karachi";

export interface PrayerTimeEntry {
  name: PrayerName;
  time: Date;
}

export interface AdhanPreferences {
  enabledPrayers: Record<PrayerName, boolean>;
  calculationMethod: MethodKey;
}

interface AdhanState {
  todayTimes: PrayerTimeEntry[];
  tomorrowTimes: PrayerTimeEntry[];
  preferences: AdhanPreferences;
  initialized: boolean;
  // Actions
  initialize: () => Promise<void>;
  recalculateAndSchedule: () => Promise<void>;
  togglePrayer: (prayer: PrayerName) => Promise<void>;
  setCalculationMethod: (method: MethodKey) => Promise<void>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PREFS_KEY = "@adhan_preferences";
const ADHAN_SOUND = "adahnsounda.mp3";
const FAJR_SOUND = "adahnsoundfajr.mp3";
const ALARM_CHANNEL_ID = "adhan_alarm";
const FAJR_CHANNEL_ID = "adhan_alarm_fajr";

const ALL_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

// Default: Algiers coordinates
const DEFAULT_LAT = 36.75;
const DEFAULT_LON = 3.06;

const DEFAULT_PREFS: AdhanPreferences = {
  enabledPrayers: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  calculationMethod: "algerian",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function calculateTimesForDate(
  date: Date,
  lat: number,
  lon: number,
  method: MethodKey,
): PrayerTimeEntry[] {
  const coords = new Coordinates(lat, lon);
  const params = getCalculationParams(method);
  const pt = new PrayerTimes(coords, date, params);

  return [
    { name: "fajr", time: pt.fajr },
    { name: "dhuhr", time: pt.dhuhr },
    { name: "asr", time: pt.asr },
    { name: "maghrib", time: pt.maghrib },
    { name: "isha", time: pt.isha },
  ];
}

async function getCoordinates(): Promise<{ lat: number; lon: number }> {
  const saved = await getSavedLocation();
  if (saved) {
    const lat = parseFloat(saved.lat);
    const lon = parseFloat(saved.lon);
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
  }
  return { lat: DEFAULT_LAT, lon: DEFAULT_LON };
}

async function loadPreferences(): Promise<AdhanPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PREFS, ...parsed };
    }
  } catch (e) {
    console.error("[AdhanStore] Failed to load preferences:", e);
  }
  return { ...DEFAULT_PREFS };
}

async function savePreferences(prefs: AdhanPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error("[AdhanStore] Failed to save preferences:", e);
  }
}

function getPrayerTranslationKey(prayer: PrayerName): string {
  return `adhan.${prayer}`;
}

async function scheduleNotifications(
  todayTimes: PrayerTimeEntry[],
  tomorrowTimes: PrayerTimeEntry[],
  enabledPrayers: Record<PrayerName, boolean>,
): Promise<void> {
  // Cancel all existing
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const allTimes = [...todayTimes, ...tomorrowTimes];

  for (const entry of allTimes) {
    if (!enabledPrayers[entry.name]) continue;
    if (entry.time <= now) continue;

    const isFajr = entry.name === "fajr";
    const prayerLabel = i18n.t(getPrayerTranslationKey(entry.name));

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🕌 " + prayerLabel,
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
    } catch (e) {
      console.error(
        `[AdhanStore] Failed to schedule ${entry.name} at ${entry.time}:`,
        e,
      );
    }
  }

}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useAdhanStore = create<AdhanState>((set, get) => ({
  todayTimes: [],
  tomorrowTimes: [],
  preferences: { ...DEFAULT_PREFS },
  initialized: false,

  initialize: async () => {
    const prefs = await loadPreferences();
    const { lat, lon } = await getCoordinates();

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTimes = calculateTimesForDate(today, lat, lon, prefs.calculationMethod);
    const tomorrowTimes = calculateTimesForDate(tomorrow, lat, lon, prefs.calculationMethod);

    set({ todayTimes, tomorrowTimes, preferences: prefs, initialized: true });

    await scheduleNotifications(todayTimes, tomorrowTimes, prefs.enabledPrayers);
  },

  recalculateAndSchedule: async () => {
    const { preferences } = get();
    const { lat, lon } = await getCoordinates();

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTimes = calculateTimesForDate(today, lat, lon, preferences.calculationMethod);
    const tomorrowTimes = calculateTimesForDate(tomorrow, lat, lon, preferences.calculationMethod);

    set({ todayTimes, tomorrowTimes });

    await scheduleNotifications(todayTimes, tomorrowTimes, preferences.enabledPrayers);
  },

  togglePrayer: async (prayer: PrayerName) => {
    const { preferences, todayTimes, tomorrowTimes } = get();
    const updated: AdhanPreferences = {
      ...preferences,
      enabledPrayers: {
        ...preferences.enabledPrayers,
        [prayer]: !preferences.enabledPrayers[prayer],
      },
    };

    set({ preferences: updated });
    await savePreferences(updated);
    await scheduleNotifications(todayTimes, tomorrowTimes, updated.enabledPrayers);
  },

  setCalculationMethod: async (method: MethodKey) => {
    const { preferences } = get();
    const updated: AdhanPreferences = { ...preferences, calculationMethod: method };

    set({ preferences: updated });
    await savePreferences(updated);

    // Recalculate with new method
    const { lat, lon } = await getCoordinates();
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTimes = calculateTimesForDate(today, lat, lon, method);
    const tomorrowTimes = calculateTimesForDate(tomorrow, lat, lon, method);

    set({ todayTimes, tomorrowTimes });
    await scheduleNotifications(todayTimes, tomorrowTimes, updated.enabledPrayers);
  },
}));
