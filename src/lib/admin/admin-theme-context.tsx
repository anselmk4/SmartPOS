"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type AdminThemeMode = "dark" | "light";

interface AdminThemeContextType {
  theme: AdminThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: AdminThemeMode) => void;
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  theme: "dark",
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

const THEME_STORAGE_KEY = "global_pos_admin_theme";

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminThemeMode>("dark");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as AdminThemeMode | null;
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
      }
    } catch {
      // Ignored in SSR or restricted storage
    }
  }, []);

  const setTheme = (newTheme: AdminThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignored
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <AdminThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      <div className={isDark ? "admin-theme-dark" : "admin-theme-light"}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error("useAdminTheme must be used within an AdminThemeProvider");
  }
  return context;
}
