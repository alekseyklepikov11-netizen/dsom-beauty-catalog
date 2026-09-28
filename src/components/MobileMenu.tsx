// Мобильное меню шапки (< 1024px): кнопка «Меню» 44×44 + выезжающая панель (Radix Dialog через ui/sheet).
// Radix даёт Esc, ловушку фокуса, блок прокрутки и возврат фокуса на кнопку.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Sheet, SheetOverlay, SheetPortal, SheetTitle } from "@/components/ui/sheet";
import { LAUNCH_CONFIG } from "@/lib/launchConfig";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  /** Классы кнопки-триггера (цвет под конкретную шапку). */
  triggerClassName?: string;
}

const MobileMenu = ({ triggerClassName = "" }: Props) => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Переход по ссылке — закрыть панель.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const switchLang = (lng: string) => {
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem("dsom-lang", lng);
    } catch {
      /* приватный режим — язык просто не запомнится */
    }
  };

  const links: { to: string; label: string; match?: string }[] = [
    { to: "/catalog", label: t("nav.catalog"), match: "/catalog" },
    { to: "/quiz", label: t("nav.quiz"), match: "/quiz" },
    { to: "/page/about", label: t("nav.about"), match: "/page/about" },
    { to: "/journal", label: t("nav.journal"), match: "/journal" },
    { to: "/page/where-to-buy", label: t("nav.stores"), match: "/page/where-to-buy" },
    { to: "/page/contacts", label: t("nav.contact"), match: "/page/contacts" },
  ];

  const secondary: { to: string; label: string }[] = [
    { to: "/favorites", label: t("nav.favorites") },
    { to: user ? "/account" : "/auth", label: user ? t("nav.account") : t("nav.login") },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetPrimitive.Trigger
        aria-label={t("a11y.menu")}
        className={`lg:hidden inline-flex items-center justify-center w-11 h-11 shrink-0 transition-opacity hover:opacity-60 ${triggerClassName}`}
      >
        <Menu className="w-5 h-5" />
      </SheetPrimitive.Trigger>
      <SheetPortal>
        <SheetOverlay className="bg-foreground/40 backdrop-blur-sm" />
        <SheetPrimitive.Content
          aria-modal="true"
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 h-full w-[86%] max-w-sm bg-background shadow-2xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=closed]:duration-300 data-[state=open]:duration-300"
        >
          <div className="flex items-center justify-between pl-6 pr-3 py-3 border-b border-border/60">
            {/* Имя диалога для скринридера совпадает с кнопкой «Меню»; видимый логотип — отдельно. */}
            <SheetTitle className="sr-only">{t("a11y.menu")}</SheetTitle>
            <span aria-hidden="true" className="font-display text-xl font-normal tracking-[0.4em] text-foreground">DSOM</span>
            <SheetPrimitive.Close
              aria-label={t("a11y.close")}
              className="inline-flex items-center justify-center w-11 h-11 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </SheetPrimitive.Close>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 py-4" aria-label={t("a11y.menu")}>
            <ul className="flex flex-col">
              {links.map((l) => {
                const active = l.match ? pathname.startsWith(l.match) : false;
                return (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`flex items-center min-h-[48px] font-display text-2xl leading-tight transition-colors hover:text-accent ${active ? "text-accent" : "text-foreground"}`}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <ul className="mt-6 pt-4 border-t border-border/60 flex flex-col">
              {secondary.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center min-h-[44px] text-[12px] tracking-luxe uppercase text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={LAUNCH_CONFIG.telegramChannel}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center min-h-[44px] text-[12px] tracking-luxe uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  Telegram {LAUNCH_CONFIG.telegramChannelUsername}
                </a>
              </li>
            </ul>
          </nav>

          <div
            className="px-6 py-4 border-t border-border/60 flex items-center gap-1 text-[12px] tracking-luxe uppercase"
            role="group"
            aria-label={t("a11y.language")}
          >
            <button
              type="button"
              onClick={() => switchLang("ru")}
              aria-pressed={i18n.language === "ru"}
              lang="ru"
              className={`min-w-[44px] min-h-[44px] px-2 ${i18n.language === "ru" ? "text-foreground font-semibold underline underline-offset-4" : "text-muted-foreground hover:text-foreground"}`}
            >
              RU
            </button>
            <span className="text-border" aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => switchLang("en")}
              aria-pressed={i18n.language === "en"}
              lang="en"
              className={`min-w-[44px] min-h-[44px] px-2 ${i18n.language === "en" ? "text-foreground font-semibold underline underline-offset-4" : "text-muted-foreground hover:text-foreground"}`}
            >
              EN
            </button>
          </div>
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
};

export default MobileMenu;
