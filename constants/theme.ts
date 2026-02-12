const tintColorLight = "#1B7A4E"; // Emerald Green
const tintColorDark = "#34D399"; // Light Emerald for Dark Mode

export const Colors = {
  light: {
    text: "#1F2937",
    textSecondary: "#6B7280",
    background: "#FFFFFF",
    tint: tintColorLight,
    icon: "#6B7280",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: tintColorLight,
    primary: "#1B7A4E",
    secondary: "#F5E6CC", // Warm Sand
    accent: "#D97706", // Amber for highlights
    card: "#F9FAFB",
    border: "#E5E7EB",
    error: "#EF4444",
  },
  dark: {
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    background: "#111827", // Dark Gray
    tint: tintColorDark,
    icon: "#9CA3AF",
    tabIconDefault: "#4B5563",
    tabIconSelected: tintColorDark,
    primary: "#34D399",
    secondary: "#78350F", // Dark Wood for contrast
    accent: "#F59E0B",
    card: "#1F2937",
    border: "#374151",
    error: "#F87171",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
};

export const Shadows = {
  light: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  dark: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
};

// Re-exported from the dedicated font registry
export { Fonts } from "./fonts";
