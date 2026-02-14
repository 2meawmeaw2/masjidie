import { Colors } from "./theme";

export type CategoryId =
  | "tafsir"
  | "fiqh"
  | "lecture"
  | "tahfidh"
  | "seerah"
  | "hadith"
  | "children"
  | "women";

export const CATEGORIES: Record<
  CategoryId,
  { label: string; icon: string; color: string }
> = {
  tafsir: {
    label: "categories.tafsir",
    icon: "book-open-page-variant",
    color: Colors.light.primary,
  },
  fiqh: { label: "categories.fiqh", icon: "scale-balance", color: "#7C3AED" },
  lecture: {
    label: "categories.lecture",
    icon: "microphone",
    color: "#2563EB",
  },
  tahfidh: { label: "categories.tahfidh", icon: "book", color: "#059669" },
  seerah: { label: "categories.seerah", icon: "history", color: "#D97706" },
  hadith: {
    label: "categories.hadith",
    icon: "format-quote-close",
    color: "#9333EA",
  },
  children: {
    label: "categories.children",
    icon: "human-child",
    color: "#EC4899",
  },
  women: { label: "categories.women", icon: "human-female", color: "#DB2777" },
};
