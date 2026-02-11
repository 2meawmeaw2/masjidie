/**
 * Font Registry
 *
 * Centralizes all font loading and semantic naming.
 * - IBM Plex Sans Arabic  → sans-serif (body text, UI)
 * - Amman Serif Pro        → serif (headings, accent)   [user-provided .ttf]
 *
 * Usage in components:  import { Fonts } from "@/constants/fonts";
 *                       style={{ fontFamily: Fonts.bold }}
 */

import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from "@expo-google-fonts/ibm-plex-sans-arabic";
import { Amiri_400Regular, Amiri_700Bold } from "@expo-google-fonts/amiri";

// ─── Font asset map (passed to useFonts in _layout.tsx) ──────────────

export const fontAssets = {
  // IBM Plex Sans Arabic (via expo-google-fonts)
  "IBMPlexSansArabic-Regular": IBMPlexSansArabic_400Regular,
  "IBMPlexSansArabic-Medium": IBMPlexSansArabic_500Medium,
  "IBMPlexSansArabic-SemiBold": IBMPlexSansArabic_600SemiBold,
  "IBMPlexSansArabic-Bold": IBMPlexSansArabic_700Bold,

  "Amiri-Regular": Amiri_400Regular,
  "Amiri-Bold": Amiri_700Bold,
  // Amman Serif Pro (drop .ttf files into assets/fonts/)
  // Uncomment once you've added the font files:
  // "AmmanSerifPro-Regular": require("@/assets/fonts/AmmanSerifPro-Regular.ttf"),
  // "AmmanSerifPro-Medium": require("@/assets/fonts/AmmanSerifPro-Medium.ttf"),
  // "AmmanSerifPro-Bold":   require("@/assets/fonts/AmmanSerifPro-Bold.ttf"),
};

// ─── Semantic font names ─────────────────────────────────────────────

/** Sans-serif family — IBM Plex Sans Arabic */
const sans = {
  regular: "IBMPlexSansArabic-Regular",
  medium: "IBMPlexSansArabic-Medium",
  semiBold: "IBMPlexSansArabic-SemiBold",
  bold: "IBMPlexSansArabic-Bold",
} as const;

/** Serif family — Amman Serif Pro (enable after adding font files) */
const amiri = {
  regular: "Amiri-Regular",
  bold: "Amiri-Bold",
} as const;

/**
 * Main Fonts export.
 *
 * - `Fonts.regular` / `.medium` / `.bold` → IBM Plex Sans Arabic (backward-compat)
 * - `Fonts.sans.*`  → full sans family
 * - `Fonts.serif.*` → Amman Serif Pro family
 */
export const Fonts = {
  // Backward-compatible flat keys (used in all existing components)
  rsans: sans.regular,
  mdsans: sans.medium,
  sbsans: sans.semiBold,
  bdsans: sans.bold,

  ramiri: amiri.regular,
  bmiri: amiri.bold,

  // Namespaced families for explicit usage
  sans,
  amiri,
} as const;
