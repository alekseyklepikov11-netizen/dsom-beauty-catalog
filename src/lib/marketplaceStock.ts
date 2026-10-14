// Наличие товара на маркетплейсах для блока покупки (схема А, 14.10.2026).
//
// Поля marketplace_links.in_stock / stock_checked_at раз в час заполняет скрипт сверки с Seller API Ozon
// (dsom-tools/content-team/ozon-nalichie/sync_ozon_stock.py). Читаем их ЖИВЫМ запросом, а не из
// /data/catalog.json: каталог-снимок обновляется реже и может отстать от остатков.
//
// Правило «сомневаешься — нет в наличии»: товар в наличии, только если in_stock = true И сверка была
// меньше суток назад. Нет полей в базе, нет сверки, ошибка сети, сверка остановилась — «нет в наличии».
import { supabase } from "@/integrations/supabase/client";

/** Сверка старше этого срока не считается: скрипт мог остановиться. */
export const STOCK_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface StockRow {
  kind: string | null;
  in_stock: boolean | null;
  stock_checked_at: string | null;
}

export function isFreshInStock(row: StockRow | null | undefined, now: number = Date.now()): boolean {
  if (!row || row.in_stock !== true || !row.stock_checked_at) return false;
  const t = Date.parse(row.stock_checked_at);
  if (!Number.isFinite(t)) return false;
  // Время из будущего (сбитые часы) тоже не верим больше чем на 10 минут.
  return now - t < STOCK_MAX_AGE_MS && t - now < 10 * 60 * 1000;
}

/** Есть ли свежий остаток по площадкам товара: { ozon: true } и т. п. Любая ошибка — пустой объект. */
export async function fetchMarketplaceStock(productId: string): Promise<Record<string, boolean>> {
  try {
    const { data, error } = await supabase
      .from("marketplace_links")
      .select("kind,in_stock,stock_checked_at")
      .eq("product_id", productId)
      .eq("is_active", true);
    if (error || !Array.isArray(data)) return {};
    const out: Record<string, boolean> = {};
    for (const r of data as unknown as StockRow[]) {
      const kind = (r.kind || "").toLowerCase();
      if (!kind) continue;
      out[kind] = out[kind] || isFreshInStock(r);
    }
    return out;
  } catch {
    return {};
  }
}
