import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/i18n/locales/en.json";
import fa from "@/i18n/locales/fa.json";

export const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fa", label: "فارسی", dir: "rtl" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const languageKey = "language";

const getInitialLanguage = (): LanguageCode => {
  try {
    const stored = localStorage.getItem(languageKey);
    if (LANGUAGES.some((l) => l.code === stored)) return stored as LanguageCode;
  } catch {
    // storage unavailable: fall back to the default
  }
  return "en";
};

export const applyLanguage = (code: LanguageCode) => {
  const lang = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
  document.documentElement.lang = lang.code;
  document.documentElement.dir = lang.dir;
  try {
    localStorage.setItem(languageKey, lang.code);
  } catch {
    // ignore
  }
};

const initial = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fa: { translation: fa } },
  lng: initial,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

applyLanguage(initial);

export const setLanguage = (code: LanguageCode) => {
  applyLanguage(code);
  return i18n.changeLanguage(code);
};

export default i18n;
