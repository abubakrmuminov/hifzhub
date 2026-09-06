import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import ru from './locales/ru.json';
import uz from './locales/uz.json';

export const resources = {
  ru: { translation: ru },
  uz: { translation: uz },
} as const;

export type SupportedLanguage = 'ru' | 'uz';

export const getDeviceLanguage = (): SupportedLanguage => {
  const locales = Localization.getLocales();
  const primaryLocale = locales[0]?.languageCode;
  if (primaryLocale === 'uz') {
    return 'uz';
  }
  return 'ru';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'ru',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export { i18n };
