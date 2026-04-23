import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const { t } = useTranslation();
  const [socials, setSocials] = useState<{ platform: string; url: string }[]>([]);

  useEffect(() => {
    supabase.from("social_links").select("platform,url").eq("is_active", true).order("sort_order")
      .then(({ data }) => setSocials(data || []));
  }, []);

  return (
    <footer className="bg-foreground text-background py-16 mt-24">
      <div className="container grid md:grid-cols-3 gap-10">
        <div>
          <p className="font-display text-3xl tracking-[0.3em]">DSOM</p>
          <p className="text-xs text-background/50 mt-4 leading-relaxed">Уход, рождённый наукой.<br/>Москва · Санкт-Петербург.</p>
        </div>
        <div>
          <p className="text-[11px] tracking-luxe uppercase text-background/50 mb-4">{t("footer.contacts")}</p>
          <a href="mailto:science@dsom.ru" className="block text-sm hover:text-accent transition-colors">science@dsom.ru</a>
          <p className="text-sm text-background/70 mt-1">@DSOM</p>
        </div>
        <div>
          <p className="text-[11px] tracking-luxe uppercase text-background/50 mb-4">Соцсети</p>
          <div className="flex gap-4">
            {socials.map((s) => (
              <a key={s.platform} href={s.url} target="_blank" rel="noreferrer" className="text-sm uppercase tracking-wide hover:text-accent transition-colors">
                {s.platform}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="container mt-12 pt-8 border-t border-background/15 text-[11px] tracking-luxe uppercase text-background/40">
        © 2026 DSOM. {t("footer.rights")}.
      </div>
    </footer>
  );
};

export default Footer;
