-- ============================================================
-- 20260526173000_banner_text_position_and_srcset.sql
-- ============================================================
-- Добавляет:
--   1) text_position — 9-зон сетка для управления позицией наложения текста
--      на баннере (admin выбирает в dropdown под каждый баннер)
--   2) image_srcset — JSONB-карта адаптивных размеров WebP для <picture>+srcset
--      Формат: {"768w": "url", "1280w": "url", "1920w": "url"}
--      Используется браузером для выбора оптимального размера под устройство.
--      Если null — используется image_url для всех размеров (backward compat).
-- ============================================================

ALTER TABLE banners
  ADD COLUMN IF NOT EXISTS text_position text NOT NULL DEFAULT 'bottom-left';

ALTER TABLE banners
  DROP CONSTRAINT IF EXISTS banners_text_position_check;

ALTER TABLE banners
  ADD CONSTRAINT banners_text_position_check
  CHECK (text_position IN (
    'top-left',    'top-center',    'top-right',
    'middle-left', 'middle-center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ));

ALTER TABLE banners
  ADD COLUMN IF NOT EXISTS image_srcset jsonb;

COMMENT ON COLUMN banners.text_position IS
  '9-зон сетка для позиционирования наложения текста на баннере';
COMMENT ON COLUMN banners.image_srcset IS
  'Адаптивные размеры WebP: {"768w": "url", "1280w": "url", "1920w": "url"}. Null = use image_url везде.';
