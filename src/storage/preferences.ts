import type { Lang } from "@/src/types";

export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "dd_theme";
const LANG_STORAGE_KEY = "dd_language";

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota or privacy-mode errors gracefully
  }
}

export function getSystemTheme(): ThemeMode {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }
  const stored = readStorage(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return getSystemTheme();
}

export function saveThemePreference(theme: ThemeMode): void {
  if (typeof window !== "undefined") {
    writeStorage(THEME_STORAGE_KEY, theme);
  }
}

export function getInitialLanguage(): Lang {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = readStorage(LANG_STORAGE_KEY);
  if (stored === "en" || stored === "ar") {
    return stored;
  }
  return "en";
}

export function saveLanguagePreference(lang: Lang): void {
  if (typeof window !== "undefined") {
    writeStorage(LANG_STORAGE_KEY, lang);
  }
}
