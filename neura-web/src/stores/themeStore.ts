import { create } from "zustand";

type ThemeMode = "dark" | "light";

interface ThemeState {
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const themeKey = "theme";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";
  const storedTheme = localStorage.getItem(themeKey);
  return storedTheme === "light" ? "light" : "dark";
};

const applyTheme = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(themeKey, theme);
};

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: initialTheme === "dark",

  setTheme: (theme) => {
    applyTheme(theme);
    set({ isDark: theme === "dark" });
  },

  toggleTheme: () => {
    const nextTheme = get().isDark ? "light" : "dark";
    applyTheme(nextTheme);
    set({ isDark: nextTheme === "dark" });
  },
}));
