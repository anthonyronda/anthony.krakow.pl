import en from "./en.json";
import pl from "./pl.json";

type Translations = typeof en;
type LocaleKey = keyof Translations;

const translations: Record<string, Translations> = { en, pl };

export function t(
  key: LocaleKey,
  locale: string,
  vars?: Record<string, string>,
): string {
  const dict = translations[locale] ?? translations["en"];
  let str: string =
    (dict as Record<string, string>)[key] ??
    (en as Record<string, string>)[key] ??
    key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}

export function getAlternateLocale(locale: string): string {
  return locale === "en" ? "pl" : "en";
}

export const locales = ["en", "pl"] as const;
export type Locale = (typeof locales)[number];

export const dateFormats: Record<
  string,
  { intlLocale: string; options: Intl.DateTimeFormatOptions; suffix: string }
> = {
  en: {
    intlLocale: "en-GB",
    options: { day: "numeric", month: "long", year: "numeric" },
    suffix: "",
  },
  pl: {
    intlLocale: "pl",
    options: { day: "numeric", month: "long", year: "numeric" },
    suffix: "\u00a0r.",
  },
};

export function formatDate(date: Date, locale: string): string {
  const fmt = dateFormats[locale] ?? dateFormats["en"];
  return date.toLocaleDateString(fmt.intlLocale, fmt.options) + fmt.suffix;
}
