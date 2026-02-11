import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useIOsColorScheme } from "react-native";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useIOsColorScheme();
  const [theme, setTheme] = useState<Theme>(
    systemScheme === "dark" ? "dark" : "light",
  );

  // React to system changes if the user hasn't manually set a theme?
  // For simplicity and "pro" behavior, we might want to respect system changes
  // until the user overrides, but simpler is just state.
  // Let's stick to state initialization from system, then manual control.

  useEffect(() => {
    if (systemScheme) {
      setTheme(systemScheme);
    }
  }, [systemScheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
