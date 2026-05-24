// ─────────────────────────────────────────────
//  M24 KENZO — Theme Definitions
//  Add new themes here. One object = one theme.
//  ThemeProvider will apply these as CSS vars.
// ─────────────────────────────────────────────

export const themes = {

  // ── DEFAULT: Dark Neon (TikTok-inspired) ──
  darkNeon: {
    id: "darkNeon",
    label: "Dark Neon",

    colors: {
      // Backgrounds
      bgPrimary:    "#0a0a0a",
      bgSecondary:  "#111111",
      bgCard:       "#1a1a1a",
      bgElevated:   "#222222",
      bgOverlay:    "rgba(0,0,0,0.75)",

      // Accents
      accent:       "#fe2c55",   // M24 red
      accentGlow:   "rgba(254,44,85,0.35)",
      accentSecond: "#25f4ee",   // cyan
      gold:         "#f0c040",

      // Text
      textPrimary:  "#ffffff",
      textSecondary:"#aaaaaa",
      textMuted:    "#555555",
      textInvert:   "#000000",

      // UI
      border:       "#2a2a2a",
      borderActive: "#fe2c55",
      success:      "#25f4ee",
      danger:       "#fe2c55",
      warning:      "#f0c040",

      // Nav
      navBg:        "#0a0a0a",
      navActive:    "#fe2c55",
      navInactive:  "#555555",
    },

    fonts: {
      display:  "'Bebas Neue', 'Impact', sans-serif",
      heading:  "'Rajdhani', 'Arial Narrow', sans-serif",
      body:     "'DM Sans', 'Helvetica Neue', sans-serif",
      mono:     "'JetBrains Mono', monospace",
    },

    radii: {
      sm:   "6px",
      md:   "12px",
      lg:   "20px",
      xl:   "32px",
      full: "9999px",
    },

    shadows: {
      card:   "0 4px 24px rgba(0,0,0,0.6)",
      glow:   "0 0 20px rgba(254,44,85,0.4)",
      glowCyan:"0 0 20px rgba(37,244,238,0.3)",
    },

    transitions: {
      fast:   "0.15s ease",
      normal: "0.25s ease",
      slow:   "0.4s ease",
    },
  },

  // ── THEME 2: Light Minimal (add more themes below) ──
  lightMinimal: {
    id: "lightMinimal",
    label: "Light Minimal",

    colors: {
      bgPrimary:    "#f9f9f9",
      bgSecondary:  "#ffffff",
      bgCard:       "#ffffff",
      bgElevated:   "#f0f0f0",
      bgOverlay:    "rgba(255,255,255,0.85)",

      accent:       "#fe2c55",
      accentGlow:   "rgba(254,44,85,0.2)",
      accentSecond: "#0095f6",
      gold:         "#e6a800",

      textPrimary:  "#111111",
      textSecondary:"#555555",
      textMuted:    "#999999",
      textInvert:   "#ffffff",

      border:       "#e5e5e5",
      borderActive: "#fe2c55",
      success:      "#00ba88",
      danger:       "#fe2c55",
      warning:      "#e6a800",

      navBg:        "#ffffff",
      navActive:    "#fe2c55",
      navInactive:  "#aaaaaa",
    },

    fonts: {
      display:  "'Bebas Neue', 'Impact', sans-serif",
      heading:  "'Rajdhani', 'Arial Narrow', sans-serif",
      body:     "'DM Sans', 'Helvetica Neue', sans-serif",
      mono:     "'JetBrains Mono', monospace",
    },

    radii: {
      sm:   "6px",
      md:   "12px",
      lg:   "20px",
      xl:   "32px",
      full: "9999px",
    },

    shadows: {
      card:    "0 2px 16px rgba(0,0,0,0.08)",
      glow:    "0 0 16px rgba(254,44,85,0.25)",
      glowCyan:"0 0 16px rgba(0,149,246,0.2)",
    },

    transitions: {
      fast:   "0.15s ease",
      normal: "0.25s ease",
      slow:   "0.4s ease",
    },
  },

  // ── ADD MORE THEMES HERE ──
  // purpleDream: { ... },
  // retroWave:   { ... },
};

export const defaultTheme = "darkNeon";
