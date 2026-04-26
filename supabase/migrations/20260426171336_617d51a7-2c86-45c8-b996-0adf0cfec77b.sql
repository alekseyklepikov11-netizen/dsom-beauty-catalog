
-- 1. Расширяем таблицу подписчиков для юридической чистоты (152-ФЗ)
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS consent_source text,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS consent_ip text,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_unique
  ON public.newsletter_subscribers (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_token_unique
  ON public.newsletter_subscribers (unsubscribe_token);

-- 2. Расширяем profiles согласиями
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pdn_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz;

-- 3. Таблица email-кампаний (массовых рассылок)
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  preheader text,
  content_html text NOT NULL,
  content_text text,
  segment text NOT NULL DEFAULT 'all_active',
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipients_count integer NOT NULL DEFAULT 0,
  delivered_count integer NOT NULL DEFAULT 0,
  unsubscribed_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns: editors all"
  ON public.email_campaigns FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER touch_email_campaigns
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Лог отправок кампаний
CREATE TABLE IF NOT EXISTS public.email_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES public.newsletter_subscribers(id) ON DELETE SET NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_campaign_recipients_campaign_idx
  ON public.email_campaign_recipients (campaign_id);

ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign recipients: editors read"
  ON public.email_campaign_recipients FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Campaign recipients: editors write"
  ON public.email_campaign_recipients FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- 5. Обновляем триггер handle_new_user_with_role чтобы сохранять согласия
CREATE OR REPLACE FUNCTION public.handle_new_user_with_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _marketing boolean := COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, false);
BEGIN
  INSERT INTO public.profiles (id, email, full_name, pdn_consent_at, marketing_consent, marketing_consent_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    now(),
    _marketing,
    CASE WHEN _marketing THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT DO NOTHING;

  -- Если согласие на маркетинг получено — добавим в подписчики
  IF _marketing THEN
    INSERT INTO public.newsletter_subscribers (email, source, consent_source, consent_at, user_id, is_active)
    VALUES (NEW.email, 'registration', 'registration', now(), NEW.id, true)
    ON CONFLICT (lower(email)) DO UPDATE
      SET is_active = true,
          unsubscribed_at = NULL,
          user_id = COALESCE(public.newsletter_subscribers.user_id, EXCLUDED.user_id),
          consent_source = COALESCE(public.newsletter_subscribers.consent_source, 'registration'),
          consent_at = COALESCE(public.newsletter_subscribers.consent_at, now());
  END IF;

  RETURN NEW;
END;
$function$;

-- Убедимся что триггер на auth.users существует
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_role();
