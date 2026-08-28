"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

interface LandingThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const LandingThemeContext = createContext<LandingThemeContextType>({
  theme: "dark",
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function LandingThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    // Check saved preference or system preference
    const saved = localStorage.getItem("landing_theme_mode") as ThemeMode | null;
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
    } else {
      // Default to dark as primary fintech look, or can match prefers-color-scheme
      setThemeState("dark");
    }
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem("landing_theme_mode", newTheme);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <LandingThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </LandingThemeContext.Provider>
  );
}

export function useLandingTheme() {
  return useContext(LandingThemeContext);
}
