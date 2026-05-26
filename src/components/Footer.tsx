import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NewsletterForm from "@/components/NewsletterForm";

const Footer = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [socials, setSocials] = useState<{ platform: string; url: string }[]>([]);

  useEffect(() => {
    supabase.from("social_links").select("platform,url").eq("is_active", true).order("sort_order")
      .then(({ data }) => setSocials(data || []));
  }, []);

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container grid md:grid-cols-4 gap-10">
        <div>
          <p className="font-display text-3xl tracking-[0.3em]">DSOM</p>
          <p className="text-xs text-background/50 mt-4 leading-relaxed whitespace-pre-line">
            {lang === "en"
              ? "Derma Science Of Modernity\nThe science of modern skin."
              : "Derma Science Of Modernity\nНаука о коже современности"}
          </p>
        </div>

        <div>
          <p className="text-[11px] tracking-luxe uppercase text-background/50 mb-4">{t("footer.contacts")}</p>
          <Link to="/page/contacts" className="block text-sm hover:text-accent transition-colors">
            {lang === "en" ? "Contacts & details" : "Контакты и реквизиты"}
          </Link>
          <a href="mailto:hello@dsom.ru" className="block text-sm hover:text-accent transition-colors mt-1">hello@dsom.ru</a>
          <a href="https://t.me/dsom_official" target="_blank" rel="noreferrer" className="block text-sm hover:text-accent transition-colors mt-1">Telegram @dsom_official</a>
        </div>

        <div>
          <p className="text-[11px] tracking-luxe uppercase text-background/50 mb-4">
            {lang === "en" ? "Pages" : "Разделы"}
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/catalog" className="hover:text-accent transition-colors">{t("nav.catalog")}</Link>
            <Link to="/page/about" className="hover:text-accent transition-colors">{t("nav.about")}</Link>
            <Link to="/page/philosophy" className="hover:text-accent transition-colors">{lang === "en" ? "Philosophy" : "Философия"}</Link>
            <Link to="/page/values" className="hover:text-accent transition-colors">{lang === "en" ? "Values" : "Ценности"}</Link>
            <Link to="/page/where-to-buy" className="hover:text-accent transition-colors">{lang === "en" ? "Where to buy" : "Где купить"}</Link>
            <Link to="/page/delivery" className="hover:text-accent transition-colors">{lang === "en" ? "Delivery" : "Доставка"}</Link>
            <Link to="/page/care" className="hover:text-accent transition-colors">{lang === "en" ? "Client care" : "Забота о клиентах"}</Link>
            <Link to="/page/contacts" className="hover:text-accent transition-colors">{lang === "en" ? "Contacts" : "Контакты"}</Link>
            <Link to="/favorites" className="hover:text-accent transition-colors">{lang === "en" ? "Favorites" : "Избранное"}</Link>
          </div>
        </div>

        <div>
          <p className="text-[11px] tracking-luxe uppercase text-background/50 mb-4">
            {lang === "en" ? "Newsletter" : "Подписка на новости"}
          </p>
          <p className="text-xs text-background/60 mb-3 leading-relaxed">
            {lang === "en" ? "Launches, restocks, rituals — straight to inbox." : "Новинки, ритуалы и закрытые акции — прямо на почту."}
          </p>
          <NewsletterForm source="footer" />

          {socials.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px] tracking-luxe uppercase text-background/50 mb-3">
                {lang === "en" ? "Social" : "Соцсети"}
              </p>
              <div className="flex gap-4">
                {socials.map((s) => (
                  <a key={s.platform} href={s.url} target="_blank" rel="noreferrer" className="text-sm uppercase tracking-wide hover:text-accent transition-colors">
                    {s.platform}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="container mt-12 pt-8 border-t border-background/15 text-[11px] tracking-luxe uppercase text-background/40 flex flex-col md:flex-row justify-between gap-2">
        <span>© 2026 DSOM · {t("footer.rights")}</span>
        <span className="normal-case tracking-normal text-background/50">
          Произведено в России ·{" "}
          <a href="/oferta" className="underline hover:text-background/70">Реквизиты в публичной оферте</a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
