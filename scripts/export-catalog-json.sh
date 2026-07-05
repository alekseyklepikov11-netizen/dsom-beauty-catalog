#!/usr/bin/env bash
# ============================================================
# export-catalog-json.sh — экспорт публичного каталога DSOM
# из self-hosted Supabase в статический JSON.
# ============================================================
# Запускается НА VPS (где docker-контейнер supabase-db).
# Пишет /var/www/dsom-frontend/data/catalog.json атомарно (tmp + mv).
# Фронт читает его как /data/catalog.json вместо «водопада» запросов
# к Supabase; при отсутствии/устаревании файла фронт сам fallback'ится
# на живой Supabase — т.е. падение этого скрипта НЕ критично.
#
# Только публичные поля; products — только is_visible=true;
# pages — только is_published; секретов/PII в выгрузке нет.
#
# Деплой и расписание:
#   scp scripts/export-catalog-json.sh root@dsom.ru:/opt/export-catalog-json.sh
#   chmod +x /opt/export-catalog-json.sh
#   crontab: */15 * * * * /opt/export-catalog-json.sh >/dev/null 2>&1
#
# ПОДСКАЗКА для /opt/dsom-deploy.sh — добавить ПОСЛЕ rsync фронта
# (rsync затирает dist, а data/ живёт отдельно, но перегенерация
# сразу после деплоя гарантирует свежий файл):
#   bash /opt/export-catalog-json.sh || echo "[deploy] catalog.json export failed — фронт fallback'ится на Supabase"
# ============================================================
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-supabase-db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-postgres}"
OUT_DIR="${OUT_DIR:-/var/www/dsom-frontend/data}"
OUT_FILE="$OUT_DIR/catalog.json"

mkdir -p "$OUT_DIR"
TMP_FILE="$(mktemp "$OUT_DIR/.catalog.json.XXXXXX")"
trap 'rm -f "$TMP_FILE"' EXIT

# Один SELECT — один согласованный снапшот всех публичных таблиц.
# empty_tables — маркер для фронта: к каким таблицам не слать запросы вовсе.
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" --no-psqlrc -qAtX <<'SQL' > "$TMP_FILE"
SELECT json_build_object(
  'generated_at', now(),

  'products', (SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT id, slug, name, name_en, subtitle, subtitle_en,
           description, description_en, ingredients, ingredients_en,
           how_to_use, how_to_use_en, price, volume, cover_image_url,
           is_bestseller, is_new, is_visible, brand_id, category_id,
           subcategory_id, skin_types, tags, sort_order, video_url, updated_at
    FROM products WHERE is_visible = true ORDER BY sort_order, name
  ) t),

  'product_images', (SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT pi.id, pi.product_id, pi.url, pi.alt, pi.sort_order
    FROM product_images pi
    JOIN products p ON p.id = pi.product_id AND p.is_visible = true
    ORDER BY pi.product_id, pi.sort_order
  ) t),

  'categories', (SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT id, slug, name, name_en, description, description_en, parent_id, sort_order
    FROM categories WHERE is_visible = true ORDER BY sort_order, name
  ) t),

  'brands', (SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT id, slug, name, name_en, country, description, description_en, logo_url, sort_order
    FROM brands WHERE is_visible = true ORDER BY sort_order, name
  ) t),

  'marketplace_links', (SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT ml.id, ml.product_id, ml.kind, ml.url, ml.label
    FROM marketplace_links ml
    JOIN products p ON p.id = ml.product_id AND p.is_visible = true
    WHERE ml.is_active = true
    ORDER BY ml.product_id
  ) t),

  'pages', (SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT slug, title, title_en, content, content_en, updated_at
    FROM pages WHERE is_published = true ORDER BY slug
  ) t),

  'banners', (SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT id, position, title, title_en, subtitle, subtitle_en,
           cta_label, cta_label_en, cta_url, image_url, image_srcset,
           image_focal_point, video_url, text_position, ab_group, sort_order
    FROM banners WHERE is_active = true ORDER BY position, sort_order
  ) t),

  'social_links', (SELECT coalesce(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT platform, url, sort_order
    FROM social_links WHERE is_active = true ORDER BY sort_order
  ) t),

  'empty_tables', (SELECT coalesce(json_agg(tbl), '[]'::json) FROM (
    SELECT 'reviews' AS tbl
      WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE status = 'approved')
    UNION ALL
    SELECT 'promo_codes'
      WHERE NOT EXISTS (SELECT 1 FROM promo_codes WHERE is_active = true AND is_public = true)
  ) e)
);
SQL

# --- Валидация перед публикацией: не подсовываем фронту мусор ---
if [ ! -s "$TMP_FILE" ]; then
  echo "[export-catalog] ERROR: пустой вывод psql" >&2
  exit 1
fi
if command -v python3 >/dev/null 2>&1; then
  python3 -m json.tool "$TMP_FILE" >/dev/null || { echo "[export-catalog] ERROR: невалидный JSON" >&2; exit 1; }
elif command -v jq >/dev/null 2>&1; then
  jq -e . "$TMP_FILE" >/dev/null || { echo "[export-catalog] ERROR: невалидный JSON" >&2; exit 1; }
else
  head -c1 "$TMP_FILE" | grep -q '{' || { echo "[export-catalog] ERROR: вывод не похож на JSON" >&2; exit 1; }
fi

chmod 644 "$TMP_FILE"
mv -f "$TMP_FILE" "$OUT_FILE"   # atomic: nginx никогда не увидит недописанный файл
trap - EXIT

echo "[export-catalog] OK: $(wc -c < "$OUT_FILE") bytes → $OUT_FILE"
