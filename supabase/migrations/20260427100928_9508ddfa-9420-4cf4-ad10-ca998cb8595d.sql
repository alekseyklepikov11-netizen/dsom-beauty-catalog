-- Support channels: настраиваемые категории обращений с email-адресами
CREATE TABLE public.support_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  label_en text,
  description text,
  description_en text,
  email text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_channels_email_check CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

ALTER TABLE public.support_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support channels public read"
  ON public.support_channels FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Support channels admin all"
  ON public.support_channels FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER support_channels_touch_updated_at
  BEFORE UPDATE ON public.support_channels
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Дефолтные каналы (admin может потом изменить email и добавить новые)
INSERT INTO public.support_channels (slug, label, label_en, description, description_en, email, sort_order) VALUES
  ('general', 'Общие вопросы', 'General questions', 'Любые вопросы о бренде, продукции, сайте', 'Any questions about the brand, products, website', 'info@dsom.beauty', 10),
  ('orders', 'Заказы и доставка', 'Orders & shipping', 'Вопросы о заказе, доставке, оплате, возврате', 'Order, shipping, payment and return questions', 'info@dsom.beauty', 20),
  ('complaints', 'Жалобы и претензии', 'Complaints', 'Качество товара, брак, проблемы с обслуживанием', 'Product quality issues, defects, service problems', 'info@dsom.beauty', 30),
  ('partnership', 'Сотрудничество', 'Partnership', 'B2B, оптовые поставки, размещение в магазинах', 'B2B, wholesale, store placement', 'info@dsom.beauty', 40),
  ('press', 'Пресса и блогеры', 'Press & influencers', 'Сотрудничество с медиа, инфлюенсерами, PR', 'Media, influencer collaborations, PR', 'info@dsom.beauty', 50);

-- Логи обращений в поддержку (escalations) и AI-чатов (опционально, для админ-аналитики)
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.support_channels(id) ON DELETE SET NULL,
  channel_slug text,
  user_id uuid,
  user_email text NOT NULL,
  user_name text,
  subject text,
  message text NOT NULL,
  conversation_excerpt text,
  status text NOT NULL DEFAULT 'new',
  forwarded_to text,
  email_sent boolean NOT NULL DEFAULT false,
  email_error text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support tickets editors read"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Support tickets editors update"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Support tickets editors delete"
  ON public.support_tickets FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert: только через edge function (service_role обходит RLS), фронт не пишет напрямую
CREATE TRIGGER support_tickets_touch_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_support_tickets_created ON public.support_tickets (created_at DESC);
CREATE INDEX idx_support_tickets_status ON public.support_tickets (status);