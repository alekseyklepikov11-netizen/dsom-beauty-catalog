import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const Header = ({ floating = false }: { floating?: boolean }) => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const switchLang = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("dsom-lang", lng);
  };

  // Floating white pill navbar (used over hero video) — Logoisum-style
  if (floating) {
    return (
      <header className="fixed top-5 inset-x-0 z-50 px-4">
        <div className="mx-auto max-w-6xl rounded-[16px] bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.18)] py-2 pl-5 pr-2 flex items-center justify-between">
          {/* Left — logo */}
          <Link to="/" className="font-display text-[22px] tracking-[0.4em] text-[#111]">
            DSOM
          </Link>

          {/* Center — menu */}
          <nav className="hidden md:flex items-center gap-9 font-barlow font-medium text-[14px] text-[#111]">
            <Link to="/about" className="hover:opacity-60 transition-opacity">{t("nav.about")}</Link>
            <Link to="/catalog" className={`hover:opacity-60 transition-opacity ${pathname.startsWith("/catalog") ? "opacity-60" : ""}`}>{t("nav.catalog")}</Link>
            <Link to="/stores" className="hover:opacity-60 transition-opacity">{t("nav.stores")}</Link>
            <Link to="/contact" className="hover:opacity-60 transition-opacity">{t("nav.contact")}</Link>
          </nav>

          {/* Right — lang + dark CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 font-barlow text-[12px] text-[#111] pr-1">
              <button onClick={() => switchLang("ru")} className={i18n.language === "ru" ? "font-semibold" : "opacity-50 hover:opacity-100"}>RU</button>
              <span className="opacity-30">/</span>
              <button onClick={() => switchLang("en")} className={i18n.language === "en" ? "font-semibold" : "opacity-50 hover:opacity-100"}>EN</button>
            </div>
            <Link
              to="/catalog"
              className="group inline-flex items-center gap-2.5 bg-[#222] text-white rounded-full pl-5 pr-1.5 py-1.5 font-barlow font-medium text-[13px] hover:bg-[#000] transition-colors"
            >
              <span>{t("nav.shop")}</span>
              <span className="grid place-items-center w-9 h-9 rounded-full bg-white text-[#222]">
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
              </span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Solid header for inner pages
  return (
    <header className="sticky top-0 inset-x-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60">
      <div className="container flex items-center justify-between py-5">
        <Link to="/" className="font-display text-2xl tracking-[0.4em] text-foreground">DSOM</Link>
        <nav className="hidden md:flex items-center gap-10 text-[11px] tracking-luxe uppercase">
          <Link to="/catalog" className={`hover:text-accent transition-colors ${pathname.startsWith("/catalog") ? "text-accent" : ""}`}>{t("nav.catalog")}</Link>
          <Link to="/about" className="hover:text-accent transition-colors">{t("nav.about")}</Link>
          <Link to="/stores" className="hover:text-accent transition-colors">{t("nav.stores")}</Link>
          <Link to="/contact" className="hover:text-accent transition-colors">{t("nav.contact")}</Link>
        </nav>
        <div className="flex items-center gap-3 text-[11px] tracking-luxe uppercase">
          <button onClick={() => switchLang("ru")} className={i18n.language === "ru" ? "text-accent" : "text-muted-foreground hover:text-foreground"}>RU</button>
          <span className="text-border">·</span>
          <button onClick={() => switchLang("en")} className={i18n.language === "en" ? "text-accent" : "text-muted-foreground hover:text-foreground"}>EN</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
