import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ──────────────────────────────────────────────
// Persistence key
// ──────────────────────────────────────────────

const STORAGE_KEY = "@saved_bookmarks";

// ──────────────────────────────────────────────
// Store types
// ──────────────────────────────────────────────

interface BookmarksData {
  mosqueIds: string[];
  schoolIds: string[];
}

interface BookmarksState {
  savedMosqueIds: string[];
  savedSchoolIds: string[];
  isHydrated: boolean;

  // ── Mutations ────────────────────────────────
  hydrate: () => Promise<void>;
  toggleMosque: (id: string) => void;
  toggleSchool: (id: string) => void;

  // ── Selectors ────────────────────────────────
  isMosqueSaved: (id: string) => boolean;
  isSchoolSaved: (id: string) => boolean;
}

// ──────────────────────────────────────────────
// Persistence helpers
// ──────────────────────────────────────────────

async function persist(data: BookmarksData) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("[bookmarksStore] persist failed:", e);
  }
}

async function load(): Promise<BookmarksData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        mosqueIds: parsed.mosqueIds ?? [],
        schoolIds: parsed.schoolIds ?? [],
      };
    }
    return { mosqueIds: [], schoolIds: [] };
  } catch (e) {
    console.error("[bookmarksStore] load failed:", e);
    return { mosqueIds: [], schoolIds: [] };
  }
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  savedMosqueIds: [],
  savedSchoolIds: [],
  isHydrated: false,

  hydrate: async () => {
    const data = await load();
    set({
      savedMosqueIds: data.mosqueIds,
      savedSchoolIds: data.schoolIds,
      isHydrated: true,
    });
  },

  toggleMosque: (id) => {
    const { savedMosqueIds, savedSchoolIds } = get();
    const next = savedMosqueIds.includes(id)
      ? savedMosqueIds.filter((mid) => mid !== id)
      : [...savedMosqueIds, id];
    set({ savedMosqueIds: next });
    persist({ mosqueIds: next, schoolIds: savedSchoolIds });
  },

  toggleSchool: (id) => {
    const { savedMosqueIds, savedSchoolIds } = get();
    const next = savedSchoolIds.includes(id)
      ? savedSchoolIds.filter((sid) => sid !== id)
      : [...savedSchoolIds, id];
    set({ savedSchoolIds: next });
    persist({ mosqueIds: savedMosqueIds, schoolIds: next });
  },

  isMosqueSaved: (id) => {
    return get().savedMosqueIds.includes(id);
  },

  isSchoolSaved: (id) => {
    return get().savedSchoolIds.includes(id);
  },
}));
