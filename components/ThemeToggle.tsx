import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  // Choose colors based on current theme to contrast
  const backgroundColor =
    theme === "light" ? Colors.light.text : Colors.dark.text;
  const iconColor =
    theme === "light" ? Colors.light.background : Colors.dark.background;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }]}
      onPress={toggleTheme}
      activeOpacity={0.8}
    >
      <Ionicons
        name={theme === "light" ? "moon" : "sunny"}
        size={24}
        color={iconColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 120, // Positioned above typical tab bar height
    right: 20,
    zIndex: 999,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
