import React, { createContext, useContext, useState, useEffect } from "react";
import { themes, defaultTheme } from "./themes";

// ─────────────────────────────────────────────
//  ThemeContext — use this hook anywhere in app
//  const { theme, themeId, setTheme, allThemes } = useTheme();
// ─────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(
    () => localStorage.getItem("m24_theme") || defaultTheme
  );

  const theme = themes[themeId] || themes[defaultTheme];

  // Inject all theme values as CSS variables on <html>
  useEffect(() => {
    const root = document.documentElement;
    const { colors, fonts, radii, shadows, transitions } = theme;

    // Colors
    Object.entries(colors).forEach(([key, val]) => {
      root.style.setProperty(`--color-${camel(key)}`, val);
    });

    // Fonts
    Object.entries(fonts).forEach(([key, val]) => {
      root.style.setProperty(`--font-${key}`, val);
    });

    // Radii
    Object.entries(radii).forEach(([key, val]) => {
      root.style.setProperty(`--radius-${key}`, val);
    });

    // Shadows
    Object.entries(shadows).forEach(([key, val]) => {
      root.style.setProperty(`--shadow-${camel(key)}`, val);
    });

    // Transitions
    Object.entries(transitions).forEach(([key, val]) => {
      root.style.setProperty(`--transition-${key}`, val);
    });

    // Theme id on body for scoped overrides
    document.body.setAttribute("data-theme", themeId);
    localStorage.setItem("m24_theme", themeId);
  }, [theme, themeId]);

  const value = {
    theme,
    themeId,
    setTheme: (id) => { if (themes[id]) setThemeId(id); },
    allThemes: Object.values(themes).map(({ id, label }) => ({ id, label })),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

// camelCase → kebab-case helper for CSS var names
function camel(str) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}
