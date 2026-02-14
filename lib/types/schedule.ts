import { CategoryId } from "@/constants/categories";

// ──────────────────────────────────────────────
// Prayer identifiers (ready for API integration)
// ──────────────────────────────────────────────

export type PrayerId = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export const PRAYER_LABELS: Record<PrayerId, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

export const PRAYER_IDS: PrayerId[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

// ──────────────────────────────────────────────
// Scheduled event — discriminated union
// ──────────────────────────────────────────────

/** Fields shared by every scheduled event */
interface ScheduledEventBase {
  id: string;
  /** Points to Activity.id (the original event) */
  eventId: string;
  /** Snapshot for offline display */
  title: string;
  categoryId: CategoryId;
  /** Optional user note */
  note?: string;
  createdAt: string; // ISO string
}

/** Pinned to an absolute clock time */
export interface FixedTimeEvent extends ScheduledEventBase {
  anchor: "fixed";
  /** "HH:mm" format (24h) */
  time: string;
}

/** Anchored relative to a prayer */
export interface PrayerAnchoredEvent extends ScheduledEventBase {
  anchor: "prayer";
  prayerId: PrayerId;
  /** Minutes relative to the prayer. Negative = before, positive = after. */
  offsetMinutes: number;
}

export type ScheduledEvent = FixedTimeEvent | PrayerAnchoredEvent;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Optional prayer times map (HH:mm) — will come from the prayer API */
export type PrayerTimesMap = Record<PrayerId, string>;

/**
 * Resolve the display time for a scheduled event.
 * - Fixed events return their time directly.
 * - Prayer events return the resolved time if `prayerTimes` is provided,
 *   otherwise return a human-readable relative string.
 */
export function resolveDisplayTime(
  event: ScheduledEvent,
  prayerTimes?: PrayerTimesMap,
): string {
  if (event.anchor === "fixed") return event.time;

  const label = PRAYER_LABELS[event.prayerId];

  if (prayerTimes) {
    const [h, m] = prayerTimes[event.prayerId].split(":").map(Number);
    const total = h * 60 + m + event.offsetMinutes;
    const rh = Math.floor(total / 60) % 24;
    const rm = total % 60;
    return `${String(rh).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
  }

  // No prayer times available — show relative label
  if (event.offsetMinutes === 0) return label;
  const abs = Math.abs(event.offsetMinutes);
  const dir = event.offsetMinutes > 0 ? "بعد" : "قبل";
  return `${dir} ${label} بـ ${abs} د`;
}

/**
 * Sort key for a scheduled event. Returns minutes since midnight.
 * Prayer events without a times map get a rough estimate.
 */
export function resolveSortKey(
  event: ScheduledEvent,
  prayerTimes?: PrayerTimesMap,
): number {
  if (event.anchor === "fixed") {
    const [h, m] = event.time.split(":").map(Number);
    return h * 60 + m;
  }

  // Rough defaults if no prayer API yet
  const DEFAULTS: Record<PrayerId, number> = {
    fajr: 5 * 60,
    dhuhr: 12 * 60 + 30,
    asr: 15 * 60 + 30,
    maghrib: 18 * 60 + 15,
    isha: 19 * 60 + 45,
  };

  const base = prayerTimes
    ? (() => {
        const [h, m] = prayerTimes[event.prayerId].split(":").map(Number);
        return h * 60 + m;
      })()
    : DEFAULTS[event.prayerId];

  return base + event.offsetMinutes;
}
