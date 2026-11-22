import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getInitialLanguage, saveLanguagePreference } from "@/src/storage";
import type { Lang } from "@/src/types";
import { ar } from "./ar";
import { en, type TranslationDictionary } from "./en";

const dictionaries: Record<Lang, TranslationDictionary> = {
  en,
  ar,
};

interface I18nContextValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: TranslationDictionary;
  setLanguage: (next: Lang) => void;
  toggleLanguage: () => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function applyLanguageToDocument(lang: Lang): void {
  if (typeof document === "undefined") {
    return;
  }
  const dir = lang === "ar" ? "rtl" : "ltr";
  const dict = dictionaries[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  document.title = `${dict.app.name} — ${dict.app.tagline}`;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = getInitialLanguage();
    applyLanguageToDocument(initial);
    return initial;
  });

  useEffect(() => {
    applyLanguageToDocument(lang);
    saveLanguagePreference(lang);
  }, [lang]);

  const setLanguage = useCallback((next: Lang) => {
    setLangState(next);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLangState((prev) => (prev === "en" ? "ar" : "en"));
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      t: dictionaries[lang],
      setLanguage,
      toggleLanguage,
    }),
    [lang, setLanguage, toggleLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
