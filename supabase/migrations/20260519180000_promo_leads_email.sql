-- Расширяем promo_leads под email-путь воронки.
-- Один лид может прийти ЛИБО через TG (tg_user_id), ЛИБО через email (после подтверждения).

ALTER TABLE public.promo_leads ALTER COLUMN tg_user_id DROP NOT NULL;
ALTER TABLE public.promo_leads ALTER COLUMN chat_id DROP NOT NULL;
ALTER TABLE public.promo_leads ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.promo_leads ADD COLUMN IF NOT EXISTS user_id uuid;

-- Уникальность раздельно для TG и email (NULL-friendly)
ALTER TABLE public.promo_leads DROP CONSTRAINT IF EXISTS promo_leads_tg_user_id_key CASCADE;
DROP INDEX IF EXISTS promo_leads_tg_user_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS promo_leads_tg_user_unique
  ON public.promo_leads(tg_user_id) WHERE tg_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS promo_leads_email_unique
  ON public.promo_leads(lower(email)) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS promo_leads_user_id_idx ON public.promo_leads(user_id) WHERE user_id IS NOT NULL;

-- Гарантия: хотя бы один идентификатор должен быть
ALTER TABLE public.promo_leads DROP CONSTRAINT IF EXISTS promo_leads_id_check;
ALTER TABLE public.promo_leads ADD CONSTRAINT promo_leads_id_check
  CHECK (tg_user_id IS NOT NULL OR email IS NOT NULL);
