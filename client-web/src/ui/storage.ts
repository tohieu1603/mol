import type { ThemeMode } from "./theme";
import type { Language } from "./i18n";
import { getDefaultLanguage } from "./i18n";

export interface ClientSettings {
  theme: ThemeMode;
  language: Language;
  navCollapsed: boolean;
  isLoggedIn: boolean;
  username: string | null;
  authToken: string | null;  // JWT token from login
}

const STORAGE_KEY = "operis-client-settings";

const DEFAULT_SETTINGS: ClientSettings = {
  theme: "system",
  language: getDefaultLanguage(),
  navCollapsed: false,
  isLoggedIn: false,
  username: null,
  authToken: null,
};

export function loadSettings(): ClientSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: ClientSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}
