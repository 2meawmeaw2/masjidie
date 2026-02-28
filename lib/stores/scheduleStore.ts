import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ScheduledEvent,
  PrayerTimesMap,
  resolveSortKey,
} from "@/lib/types/schedule";
import {
  scheduleEventNotification,
  cancelEventNotification,
  rescheduleAllEventNotifications,
} from "@/lib/eventNotifications";

// ──────────────────────────────────────────────
// Persistence key
// ──────────────────────────────────────────────

const STORAGE_KEY = "@saved_schedule";

// ──────────────────────────────────────────────
// Store types
// ──────────────────────────────────────────────

interface ScheduleState {
  events: ScheduledEvent[];
  isHydrated: boolean;

  // ── Mutations ────────────────────────────────
  hydrate: () => Promise<void>;
  addEvent: (event: ScheduledEvent) => void;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, patch: Partial<ScheduledEvent>) => void;

  // ── Selectors ────────────────────────────────
  getEventsByAnchor: (anchor: "fixed" | "prayer") => ScheduledEvent[];
  getSortedEvents: (prayerTimes?: PrayerTimesMap) => ScheduledEvent[];
  isEventSaved: (eventId: string) => boolean;
}

// ──────────────────────────────────────────────
// Persistence helpers
// ──────────────────────────────────────────────

async function persist(events: ScheduledEvent[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error("[scheduleStore] persist failed:", e);
  }
}

async function load(): Promise<ScheduledEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("[scheduleStore] load failed:", e);
    return [];
  }
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  events: [],
  isHydrated: false,

  hydrate: async () => {
    const events = await load();
    set({ events, isHydrated: true });
    // Reschedule all event notifications on hydration
    rescheduleAllEventNotifications(events);
  },

  addEvent: (event) => {
    const next = [...get().events, event];
    set({ events: next });
    persist(next);
    scheduleEventNotification(event);
  },

  removeEvent: (id) => {
    const next = get().events.filter((e) => e.id !== id);
    set({ events: next });
    persist(next);
    cancelEventNotification(id);
  },

  updateEvent: (id, patch) => {
    const next = get().events.map((e) =>
      e.id === id ? ({ ...e, ...patch } as ScheduledEvent) : e,
    );
    set({ events: next });
    persist(next);
  },

  getEventsByAnchor: (anchor) => {
    return get().events.filter((e) => e.anchor === anchor);
  },

  getSortedEvents: (prayerTimes?) => {
    return [...get().events].sort(
      (a, b) => resolveSortKey(a, prayerTimes) - resolveSortKey(b, prayerTimes),
    );
  },

  isEventSaved: (eventId) => {
    return get().events.some((e) => e.eventId === eventId);
  },
}));
