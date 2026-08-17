-- ПДн-пакет 17.08.2026: фиксация согласий в формах (152-ФЗ).
-- stock_alerts: согласие на разовое уведомление о поступлении.
-- reviews: согласие гостя на публикацию отзыва.
-- Применено вручную на new.dsom.ru 17.08.2026 (self-hosted, миграции не автоприменяются).
ALTER TABLE public.stock_alerts
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_source text;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS consent_at timestamptz;
