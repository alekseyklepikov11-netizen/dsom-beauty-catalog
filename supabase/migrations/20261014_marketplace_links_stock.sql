-- 14.10.2026 · Схема А блока покупки (решение владельца 14.10): сайт знает, есть ли товар на маркетплейсе.
--
-- Поля заполняет только скрипт сверки dsom-tools/content-team/ozon-nalichie/sync_ozon_stock.py
-- (раз в час, задача Windows «DSOM Ozon Stock Sync», Seller API Ozon: visibility_details.has_stock).
-- Страница товара читает их живым запросом (не из catalog.json) и считает товар «в наличии на Ozon»,
-- только если in_stock = true И stock_checked_at не старше 24 часов. NULL и старая сверка = «нет в наличии».
--
-- Применять только пакетом выкладки (psql в контейнере базы), не руками и не из сессии.
-- Откат: ALTER TABLE public.marketplace_links DROP COLUMN IF EXISTS in_stock, DROP COLUMN IF EXISTS stock_checked_at;

ALTER TABLE public.marketplace_links
  ADD COLUMN IF NOT EXISTS in_stock boolean,
  ADD COLUMN IF NOT EXISTS stock_checked_at timestamptz;

COMMENT ON COLUMN public.marketplace_links.in_stock IS
  'Есть ли остаток на площадке (Ozon: visibility_details.has_stock). NULL = не проверялось. Пишет sync_ozon_stock.py.';
COMMENT ON COLUMN public.marketplace_links.stock_checked_at IS
  'Время последней успешной сверки остатка. Старше 24 ч — сайт считает «нет в наличии».';

-- Чтение полей уже открыто политикой «Mp links public read» (anon, authenticated; только is_active = true).
-- Запись — только service_role (скрипт сверки) и админ («Mp links admin all»).

NOTIFY pgrst, 'reload schema';
