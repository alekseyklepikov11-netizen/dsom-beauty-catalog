// ============================================================
// staticCatalog.ts — статический каталог из /data/catalog.json.
// ============================================================
// Убирает «водопад» клиентских запросов к Supabase: весь публичный
// каталог (products, images, categories, brands, marketplace_links,
// pages, banners, social_links) читается ОДНИМ fetch'ем статики.
//
// Файл генерируется на VPS скриптом scripts/export-catalog-json.sh
// (docker exec supabase-db psql → /var/www/dsom-frontend/data/catalog.json).
//
// Контракт для потребителей:
//   const cat = await loadStaticCatalog();
//   if (cat) { /* данные из JSON */ } else { /* fallback на Supabase */ }
//
// Fallback прозрачный: если файла нет (dev), он битый или устарел —
// loadStaticCatalog() вернёт null и каждый вызов работает по старому
// supabase-пути. НИЧЕГО не ломается.
//
// Записи (newsletter, stock_alerts, analytics), auth, админка,
// store_inventory — НЕ здесь, остаются на Supabase.
// ============================================================

const CATALOG_URL = "/data/catalog.json";
const FETCH_TIMEOUT_MS = 2000;
// Если экспортёр не обновлял файл дольше этого срока — считаем его
// устаревшим и прозрачно возвращаемся на живой Supabase.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней

// Ручной флаг для пустых таблиц (reviews / promo_codes), когда catalog.json
// недоступен: false = не слать запросы к заведомо пустым таблицам.
// Включить, когда появятся первые отзывы/промокоды (или положиться на
// маркер empty_tables из JSON — он приоритетнее флага).
const EMPTY_TABLE_FETCH_ENABLED = false;

// ---------- Типы строк каталога (только публичные поля) ----------

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  subtitle: string | null;
  subtitle_en: string | null;
  description: string | null;
  description_en: string | null;
  ingredients: string | null;
  ingredients_en: string | null;
  how_to_use: string | null;
  how_to_use_en: string | null;
  price: number;
  volume: string | null;
  cover_image_url: string | null;
  is_bestseller: boolean;
  is_new: boolean;
  is_visible: boolean;
  brand_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  skin_types: string[] | null;
  tags: string[] | null;
  sort_order: number;
  video_url: string | null;
  updated_at: string;
  /** Заполняется селекторами: доп. изображения (без cover). */
  images?: string[];
}

export interface CatalogProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

export interface CatalogCategory {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  parent_id: string | null;
  sort_order: number;
}

export interface CatalogBrand {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  country: string | null;
  description: string | null;
  description_en: string | null;
  logo_url: string | null;
  sort_order: number;
}

export interface CatalogMarketplaceLink {
  id: string;
  product_id: string;
  kind: string;
  url: string;
  label: string | null;
}

export interface CatalogPage {
  slug: string;
  title: string;
  title_en: string | null;
  content: unknown;
  content_en: unknown;
  updated_at: string;
}

export interface CatalogBanner {
  id: string;
  position: string;
  title: string;
  title_en: string | null;
  subtitle: string | null;
  subtitle_en: string | null;
  cta_label: string | null;
  cta_label_en: string | null;
  cta_url: string | null;
  image_url: string | null;
  image_srcset: Record<string, string> | null;
  image_focal_point: string | null;
  video_url: string | null;
  text_position: string | null;
  ab_group: string | null;
  sort_order: number;
}

export interface CatalogSocialLink {
  platform: string;
  url: string;
  sort_order: number;
}

export interface StaticCatalog {
  generated_at: string;
  products: CatalogProduct[];
  product_images: CatalogProductImage[];
  categories: CatalogCategory[];
  brands: CatalogBrand[];
  marketplace_links: CatalogMarketplaceLink[];
  pages: CatalogPage[];
  banners: CatalogBanner[];
  social_links: CatalogSocialLink[];
  /** Маркер пустых таблиц (reviews, promo_codes) — чтобы фронт не слал запросы впустую. */
  empty_tables?: string[];
}

// ---------- Загрузка (однократно, кэш в памяти) ----------

let cachePromise: Promise<StaticCatalog | null> | null = null;

function isFresh(cat: StaticCatalog): boolean {
  const ts = Date.parse(cat.generated_at || "");
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < MAX_AGE_MS;
}

function isValidShape(data: any): data is StaticCatalog {
  return (
    data &&
    typeof data === "object" &&
    Array.isArray(data.products) &&
    Array.isArray(data.product_images) &&
    Array.isArray(data.categories) &&
    Array.isArray(data.brands) &&
    Array.isArray(data.marketplace_links) &&
    Array.isArray(data.pages) &&
    Array.isArray(data.banners) &&
    Array.isArray(data.social_links)
  );
}

async function fetchCatalog(): Promise<StaticCatalog | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(CATALOG_URL, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (!isValidShape(data)) return null;
    if (!isFresh(data)) {
      console.warn("[staticCatalog] catalog.json устарел — fallback на Supabase");
      return null;
    }
    return data;
  } catch {
    // Нет файла (dev), таймаут, битый JSON — молча уходим на Supabase.
    return null;
  }
}

/**
 * Загружает статический каталог. Fetch выполняется один раз за сессию,
 * результат (включая null-неудачу) кэшируется в памяти.
 */
export function loadStaticCatalog(): Promise<StaticCatalog | null> {
  if (!cachePromise) cachePromise = fetchCatalog();
  return cachePromise;
}

/** Только для тестов: сброс кэша. */
export function __resetStaticCatalogCache() {
  cachePromise = null;
}

// ---------- Пустые таблицы (reviews / promo_codes) ----------

/**
 * Нужно ли вообще слать запрос к таблице, которая на pre-launch пуста.
 * Маркер empty_tables из JSON приоритетнее локального флага: когда
 * появятся первые отзывы, экспортёр уберёт таблицу из маркера и
 * запросы возобновятся сами.
 */
export async function shouldQueryTable(table: "reviews" | "promo_codes"): Promise<boolean> {
  const cat = await loadStaticCatalog();
  if (cat && Array.isArray(cat.empty_tables)) return !cat.empty_tables.includes(table);
  return EMPTY_TABLE_FETCH_ENABLED;
}

// ---------- Селекторы (повторяют текущие supabase-запросы) ----------

const bySortOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

/** Доп. изображения товара (url, отсортированы по sort_order). */
function imagesFor(cat: StaticCatalog, productId: string): CatalogProductImage[] {
  return cat.product_images.filter((i) => i.product_id === productId).sort(bySortOrder);
}

/** Бестселлеры для главной: is_bestseller, order by sort_order, limit. */
export function selectBestsellers(cat: StaticCatalog, limit = 6): CatalogProduct[] {
  return cat.products.filter((p) => p.is_bestseller).sort(bySortOrder).slice(0, limit);
}

/** Корневые видимые категории (parent_id IS NULL, order by sort_order). */
export function selectRootCategories(cat: StaticCatalog): CatalogCategory[] {
  return cat.categories.filter((c) => c.parent_id === null).sort(bySortOrder);
}

export type CatalogSort = "new" | "price_asc" | "price_desc";

/** Товары каталога: фильтр по категории (slug) / типу кожи + сортировка + доп. картинки. */
export function selectCatalogProducts(
  cat: StaticCatalog,
  opts: { categorySlug?: string | null; skin?: string | null; sort?: CatalogSort }
): CatalogProduct[] {
  let list = [...cat.products];
  if (opts.categorySlug && opts.categorySlug !== "all") {
    const c = cat.categories.find((x) => x.slug === opts.categorySlug);
    if (c) list = list.filter((p) => p.category_id === c.id);
  }
  if (opts.skin) list = list.filter((p) => (p.skin_types || []).includes(opts.skin!));
  if (opts.sort === "price_asc") list.sort((a, b) => a.price - b.price);
  else if (opts.sort === "price_desc") list.sort((a, b) => b.price - a.price);
  else list.sort((a, b) => Number(b.is_new) - Number(a.is_new) || a.sort_order - b.sort_order);
  return list.map((p) => ({ ...p, images: imagesFor(cat, p.id).map((i) => i.url) }));
}

/** Полная карточка товара по slug: продукт + изображения + маркетплейс-ссылки + бренд. */
export function selectProductBySlug(
  cat: StaticCatalog,
  slug: string
): {
  product: CatalogProduct;
  images: CatalogProductImage[];
  links: CatalogMarketplaceLink[];
  brand: CatalogBrand | null;
} | null {
  const product = cat.products.find((p) => p.slug === slug);
  if (!product) return null;
  return {
    product,
    images: imagesFor(cat, product.id),
    links: cat.marketplace_links.filter((l) => l.product_id === product.id),
    brand: product.brand_id ? cat.brands.find((b) => b.id === product.brand_id) || null : null,
  };
}

/** Товары по списку slug'ов с сохранением порядка (квиз). */
export function selectProductsBySlugs(cat: StaticCatalog, slugs: string[]): CatalogProduct[] {
  return slugs
    .map((s) => cat.products.find((p) => p.slug === s))
    .filter((p): p is CatalogProduct => Boolean(p));
}

/** Поиск по name / name_en / slug (регистронезависимо), как ilike в SearchDialog. */
export function searchProducts(cat: StaticCatalog, query: string, limit = 8): CatalogProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return cat.products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.name_en || "").toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

/** Бренд по id (для подписи в поиске/карточке). */
export function selectBrandById(cat: StaticCatalog, id: string | null): CatalogBrand | null {
  if (!id) return null;
  return cat.brands.find((b) => b.id === id) || null;
}

/** Похожие товары: сперва тот же бренд (или категория), добор из категории — как RelatedProducts. */
export function selectRelatedProducts(
  cat: StaticCatalog,
  opts: { productId: string; brandId: string | null; categoryId: string | null },
  limit = 4
): CatalogProduct[] {
  const others = cat.products.filter((p) => p.id !== opts.productId);
  let list: CatalogProduct[];
  if (opts.brandId) list = others.filter((p) => p.brand_id === opts.brandId).slice(0, limit);
  else if (opts.categoryId) list = others.filter((p) => p.category_id === opts.categoryId).slice(0, limit);
  else list = others.slice(0, limit);

  if (list.length < limit && opts.categoryId) {
    const ids = new Set(list.map((p) => p.id));
    for (const p of others) {
      if (list.length >= limit) break;
      if (!ids.has(p.id) && p.category_id === opts.categoryId) list.push(p);
    }
  }
  return list;
}

/** Активные баннеры позиции (order by sort_order). Выбор viewport/AB — в useBanner. */
export function selectBanners(cat: StaticCatalog, position: string): CatalogBanner[] {
  return cat.banners.filter((b) => b.position === position).sort(bySortOrder);
}

/** Активные соцсети для футера (order by sort_order). */
export function selectSocialLinks(cat: StaticCatalog): CatalogSocialLink[] {
  return [...cat.social_links].sort(bySortOrder);
}

/** Опубликованная CMS-страница по slug. */
export function selectPageBySlug(cat: StaticCatalog, slug: string): CatalogPage | null {
  return cat.pages.find((p) => p.slug === slug) || null;
}

/** Страницы по списку slug'ов с сохранением порядка (журнал). */
export function selectPagesBySlugs(cat: StaticCatalog, slugs: string[]): CatalogPage[] {
  return slugs
    .map((s) => cat.pages.find((p) => p.slug === s))
    .filter((p): p is CatalogPage => Boolean(p));
}
