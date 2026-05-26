// ============================================================
// banner-positions.ts — единая 9-зон сетка для overlay-текста на баннерах.
// ============================================================
// Используется в Index.tsx (home_hero), Catalog.tsx (catalog_top),
// CmsPage.tsx (about_top) и admin/BannersAdmin.tsx (UI dropdown).
//
// КРИТИЧНО: parent <section> использует row-flex (`flex` без `flex-col`).
// Для row-flex:
//   items-*    управляет ВЕРТИКАЛЬНОЙ осью (cross axis)
//     items-start = top, items-center = middle, items-end = bottom
//   justify-*  управляет ГОРИЗОНТАЛЬНОЙ осью (main axis)
//     justify-start = left, justify-center = center, justify-end = right
//
// Прежняя версия (в Index.tsx до 2026-05-27) имела оси перевёрнутыми, что
// приводило к зеркальному рендеру (bottom-left показывался как top-right).
// ============================================================

/** 9-зон позиция overlay-текста на баннере. */
export type Pos =
  | "top-left"    | "top-center"    | "top-right"
  | "middle-left" | "middle-center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

/** Все 9 позиций (для итерации в admin-dropdown). */
export const POSITIONS: ReadonlyArray<Pos> = [
  "top-left", "top-center", "top-right",
  "middle-left", "middle-center", "middle-right",
  "bottom-left", "bottom-center", "bottom-right",
];

/** Русские лейблы для admin UI. */
export const POS_LABELS: Record<Pos, string> = {
  "top-left":      "Сверху · слева",
  "top-center":    "Сверху · центр",
  "top-right":     "Сверху · справа",
  "middle-left":   "По центру · слева",
  "middle-center": "По центру · центр",
  "middle-right":  "По центру · справа",
  "bottom-left":   "Снизу · слева",
  "bottom-center": "Снизу · центр",
  "bottom-right":  "Снизу · справа",
};

/**
 * Tailwind-классы для row-flex parent: items-* (вертикаль) + justify-* (горизонталь)
 * + text-* для inline-выравнивания дочернего текста.
 */
export const POS_CLASSES: Record<Pos, string> = {
  "top-left":      "items-start  justify-start  text-left",
  "top-center":    "items-start  justify-center text-center",
  "top-right":     "items-start  justify-end    text-right",
  "middle-left":   "items-center justify-start  text-left",
  "middle-center": "items-center justify-center text-center",
  "middle-right":  "items-center justify-end    text-right",
  "bottom-left":   "items-end    justify-start  text-left",
  "bottom-center": "items-end    justify-center text-center",
  "bottom-right":  "items-end    justify-end    text-right",
};

/**
 * Виньетка-градиент с тёмным углом совпадающим с зоной текста — для контрастности.
 * Накладывается absolute поверх изображения, перед текстом.
 */
export const POS_GRADIENT: Record<Pos, string> = {
  "top-left":      "bg-gradient-to-br from-black/60 via-black/15 to-transparent",
  "top-center":    "bg-gradient-to-b  from-black/55 via-black/10 to-transparent",
  "top-right":     "bg-gradient-to-bl from-black/60 via-black/15 to-transparent",
  "middle-left":   "bg-gradient-to-r  from-black/55 via-black/15 to-transparent",
  "middle-center": "bg-black/30",
  "middle-right":  "bg-gradient-to-l  from-black/55 via-black/15 to-transparent",
  "bottom-left":   "bg-gradient-to-tr from-black/65 via-black/20 to-transparent",
  "bottom-center": "bg-gradient-to-t  from-black/60 via-black/15 to-transparent",
  "bottom-right":  "bg-gradient-to-tl from-black/65 via-black/20 to-transparent",
};

/**
 * Justify-* для CTA-row внутри text-container.
 * Выводится из горизонтальной половины позиции — кнопки выравниваются с текстом.
 */
export const POS_CTA_JUSTIFY: Record<Pos, string> = {
  "top-left":      "justify-start",
  "top-center":    "justify-center",
  "top-right":     "justify-end",
  "middle-left":   "justify-start",
  "middle-center": "justify-center",
  "middle-right":  "justify-end",
  "bottom-left":   "justify-start",
  "bottom-center": "justify-center",
  "bottom-right":  "justify-end",
};

/** Default позиция если в БД text_position не задан или невалиден. */
export const DEFAULT_POS: Pos = "middle-center";

/** Type guard для безопасной проверки строки из БД. */
export function isValidPos(s: unknown): s is Pos {
  return typeof s === "string" && (POSITIONS as ReadonlyArray<string>).includes(s);
}

// ============================================================
// FOCAL_POINTS — отдельная карта для image_focal_point (CSS object-position).
// НЕ путать с Pos: формат тут "left top" (CSS), а не "top-left" (наш).
// ============================================================

export const FOCAL_POINTS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "left top",      label: "Сверху · слева" },
  { value: "center top",    label: "Сверху · центр (для вертикальных продуктов — крышка видна)" },
  { value: "right top",     label: "Сверху · справа" },
  { value: "left center",   label: "По центру · слева" },
  { value: "center center", label: "По центру · центр (дефолт)" },
  { value: "right center",  label: "По центру · справа" },
  { value: "left bottom",   label: "Снизу · слева" },
  { value: "center bottom", label: "Снизу · центр" },
  { value: "right bottom",  label: "Снизу · справа" },
];

export const DEFAULT_FOCAL_POINT = "center center";
