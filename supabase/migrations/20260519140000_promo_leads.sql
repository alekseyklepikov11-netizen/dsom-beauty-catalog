-- Лиды промо-воронки из @dsom_promo_bot.
-- Решение собрания 19.05.2026 — бот хранит каждого юзера, фазу, код и срок.

CREATE TABLE IF NOT EXISTS public.promo_leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tg_user_id      bigint UNIQUE NOT NULL,
  chat_id         bigint NOT NULL,
  username        text,
  first_name      text,
  language_code   text,
  promo_code      text NOT NULL,                -- DSOM10 | DSOM5
  phase           text NOT NULL,                -- 'launch' | 'welcome'
  issued_at       timestamptz NOT NULL DEFAULT now(),
  valid_until     date NOT NULL,                -- персональный rolling-срок
  source          text,                         -- 'bot:start:promo5' | 'bot:callback' | etc
  notified_launch boolean NOT NULL DEFAULT false, -- разослали ли уведомление о старте
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_leads_phase_idx ON public.promo_leads(phase);
CREATE INDEX IF NOT EXISTS promo_leads_issued_at_idx ON public.promo_leads(issued_at DESC);
CREATE INDEX IF NOT EXISTS promo_leads_notified_idx ON public.promo_leads(notified_launch) WHERE notified_launch = false;

-- RLS: только service_role пишет; никаких публичных операций.
ALTER TABLE public.promo_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promo_leads_service_all ON public.promo_leads;
CREATE POLICY promo_leads_service_all ON public.promo_leads
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.promo_leads IS 'TG-лиды воронки промокода. Запись только service_role (бот).';
