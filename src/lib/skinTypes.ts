export const SKIN_TYPES = [
  { value: "dry", ru: "Сухая", en: "Dry" },
  { value: "oily", ru: "Жирная", en: "Oily" },
  { value: "combination", ru: "Комбинированная", en: "Combination" },
  { value: "normal", ru: "Нормальная", en: "Normal" },
  { value: "sensitive", ru: "Чувствительная", en: "Sensitive" },
] as const;

export type SkinType = typeof SKIN_TYPES[number]["value"];

export const skinTypeLabel = (value: string, lang: string): string => {
  const t = SKIN_TYPES.find((s) => s.value === value);
  if (!t) return value;
  return lang === "en" ? t.en : t.ru;
};
