import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NewsletterForm from "@/components/NewsletterForm";

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p === "telegram" || p === "tg") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" aria-hidden="true">
        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
      </svg>
    );
  }
  if (p === "vk" || p === "вконтакте") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" aria-hidden="true">
        <path d="M21.579 6.855c.14-.465 0-.806-.662-.806h-2.193c-.558 0-.813.295-.953.619 0 0-1.115 2.719-2.695 4.483-.51.513-.743.675-1.021.675-.139 0-.341-.162-.341-.627V6.855c0-.558-.161-.806-.626-.806H9.642c-.348 0-.558.259-.558.504 0 .528.79.65.871 2.138v3.228c0 .707-.127.836-.407.836-.743 0-2.551-2.729-3.624-5.853-.209-.607-.42-.852-.98-.852H2.752c-.627 0-.752.295-.752.619 0 .582.743 3.462 3.461 7.271 1.812 2.601 4.363 4.012 6.687 4.012 1.393 0 1.565-.313 1.565-.853v-1.966c0-.626.133-.752.574-.752.325 0 .882.164 2.183 1.417 1.486 1.486 1.732 2.153 2.567 2.153h2.192c.626 0 .939-.313.759-.932-.197-.615-.907-1.51-1.849-2.569-.512-.604-1.277-1.254-1.51-1.579-.325-.419-.232-.604 0-.976.001 0 2.672-3.761 2.95-5.04z" />
      </svg>
    );
  }
  return <span className="text-sm uppercase tracking-wide">{platform}</span>;
}

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
              <div className="flex items-center gap-4">
                {socials.map((s) => (
                  <a key={s.platform} href={s.url} target="_blank" rel="noreferrer" aria-label={s.platform} title={s.platform} className="text-background/80 hover:text-accent transition-colors">
                    <SocialIcon platform={s.platform} />
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
          <a href="/page/oferta" className="underline hover:text-background/70">Реквизиты в публичной оферте</a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
