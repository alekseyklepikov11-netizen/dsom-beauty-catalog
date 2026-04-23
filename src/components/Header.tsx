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

  // Floating glassy white navbar (used over hero video)
  if (floating) {
    return (
      <header className="fixed top-4 inset-x-0 z-50 px-4">
        <div
          className={`mx-auto max-w-6xl rounded-[20px] bg-background/85 backdrop-blur-xl border border-foreground/5 shadow-soft transition-all duration-500 ${
            scrolled ? "py-2.5" : "py-3"
          }`}
        >
          <div className="flex items-center justify-between pl-5 pr-2.5">
            <Link to="/" className="font-display text-lg tracking-[0.4em] text-foreground">DSOM</Link>
            <nav className="hidden md:flex items-center gap-9 text-[11px] tracking-luxe uppercase">
              <Link to="/catalog" className={`hover:text-accent transition-colors ${pathname.startsWith("/catalog") ? "text-accent" : ""}`}>{t("nav.catalog")}</Link>
              <Link to="/about" className="hover:text-accent transition-colors">{t("nav.about")}</Link>
              <Link to="/stores" className="hover:text-accent transition-colors">{t("nav.stores")}</Link>
              <Link to="/contact" className="hover:text-accent transition-colors">{t("nav.contact")}</Link>
            </nav>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-[10px] tracking-luxe uppercase pr-2">
                <button onClick={() => switchLang("ru")} className={i18n.language === "ru" ? "text-accent" : "text-muted-foreground hover:text-foreground"}>RU</button>
                <span className="text-border">·</span>
                <button onClick={() => switchLang("en")} className={i18n.language === "en" ? "text-accent" : "text-muted-foreground hover:text-foreground"}>EN</button>
              </div>
              <Link
                to="/catalog"
                className="group inline-flex items-center gap-2 bg-foreground text-background rounded-full pl-4 pr-1.5 py-1.5 text-[10px] tracking-luxe uppercase hover:bg-accent transition-colors"
              >
                <span>{t("nav.shop")}</span>
                <span className="grid place-items-center w-7 h-7 rounded-full bg-background/15 group-hover:bg-background/25 transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
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
