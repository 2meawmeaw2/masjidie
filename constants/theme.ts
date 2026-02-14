const tintColorLight = "#008D64"; // Deep Green
const tintColorDark = "#09B573"; // Vibrant Green for Dark Mode

export const Colors = {
  light: {
    text: "#0F303F", // Your "Black" (Midnight Teal)
    textSecondary: "#4A6572", // Muted Teal/Grey
    background: "#E7F2F2", // Your "White" (Ice Blue/Mint)
    tint: tintColorLight,
    icon: "#4A6572",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: tintColorLight,
    primary: "#008D64",
    secondary: "#E2AE1A", // Gold (used as secondary for light mode)
    accent: "#E2AE1A", // Gold
    card: "#FFFFFF", // Pure white for cards to pop against the #E7F2F2 bg
    border: "#CFD8DC", // Blue-grey border to match the theme
    error: "#EF4444",
  },
  dark: {
    text: "#E7F2F2", // Your "White"
    textSecondary: "#94A3B8", // Soft Grey-Blue
    background: "#0F303F", // Your "Black" (Midnight Teal)
    tint: tintColorDark,
    icon: "#94A3B8",
    tabIconDefault: "#4B5563",
    tabIconSelected: tintColorDark,
    primary: "#09B573",
    secondary: "#5C4505", // Darker Gold/Bronze for contrast
    accent: "#E2AE1A", // Gold
    card: "#1B4152", // A slightly lighter shade of the midnight teal
    border: "#285363", // Subtle teal border
    error: "#F87171",
  },
  // Added specifically for gradient use cases if needed
  gradient: {
    start: "#09B573",
    end: "#008D64",
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
    shadowColor: "#0F303F", // Using the midnight teal for shadow instead of pure black
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
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 3,
  },
};

// Re-exported from the dedicated font registry
export { Fonts } from "./fonts";
