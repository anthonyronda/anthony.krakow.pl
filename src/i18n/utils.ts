import en from './en.json';
import pl from './pl.json';

type Translations = typeof en;
type LocaleKey = keyof Translations;

const translations: Record<string, Translations> = { en, pl };

export function t(key: LocaleKey, locale: string, vars?: Record<string, string>): string {
  const dict = translations[locale] ?? translations['en'];
  let str: string = (dict as Record<string, string>)[key] ?? (en as Record<string, string>)[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}

export function getAlternateLocale(locale: string): string {
  return locale === 'en' ? 'pl' : 'en';
}

export const locales = ['en', 'pl'] as const;
export type Locale = (typeof locales)[number];
