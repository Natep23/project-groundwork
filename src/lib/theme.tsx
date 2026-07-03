import React from "react";

export const THEMES = [
  { id: "daylight", label: "Daylight" },
  { id: "blueprint", label: "Blueprint" },
  { id: "graphite", label: "Graphite" },
  { id: "jobsite", label: "Jobsite" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "groundwork-theme";

function initialTheme(): ThemeId {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (THEMES.some((t) => t.id === stored)) return stored as ThemeId;
  // Legacy values from the old light/dark toggle
  if (stored === "dark") return "graphite";
  if (stored === "light") return "daylight";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "graphite" : "daylight";
}

const ThemeContext = React.createContext<{
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<ThemeId>(initialTheme);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    // Keep the browser chrome color in step with the active theme's canvas.
    const bg: Record<ThemeId, string> = {
      daylight: "#f3f4f1",
      blueprint: "#10273f",
      graphite: "#17181a",
      jobsite: "#ffffff",
    };
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", bg[theme]);
  }, [theme]);

  const value = React.useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
