import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Search, Heart } from "lucide-react";
import SearchDialog from "@/components/SearchDialog";

const Header = ({ floating = false }: { floating?: boolean }) => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const switchLang = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("dsom-lang", lng);
  };

  // Floating white pill navbar (used over hero video)
  if (floating) {
    return (
      <>
        <header className="fixed top-5 inset-x-0 z-50 px-4">
          <div className="mx-auto max-w-6xl rounded-[16px] bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.18)] py-2 pl-5 pr-2 flex items-center justify-between">
            <Link to="/" className="font-display text-[22px] tracking-[0.4em] text-[#111]">
              DSOM
            </Link>

            <nav className="hidden md:flex items-center gap-9 font-barlow font-medium text-[14px] text-[#111]">
              <Link to="/page/about" className="hover:opacity-60 transition-opacity">{t("nav.about")}</Link>
              <Link to="/catalog" className={`hover:opacity-60 transition-opacity ${pathname.startsWith("/catalog") ? "opacity-60" : ""}`}>{t("nav.catalog")}</Link>
              <Link to="/page/stores" className="hover:opacity-60 transition-opacity">{t("nav.stores")}</Link>
              <Link to="/page/contact" className="hover:opacity-60 transition-opacity">{t("nav.contact")}</Link>
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="p-2 text-[#111] hover:opacity-60 transition-opacity"
              >
                <Search className="w-4 h-4" />
              </button>
              <Link to="/favorites" aria-label="Favorites" className="p-2 text-[#111] hover:opacity-60 transition-opacity">
                <Heart className="w-4 h-4" />
              </Link>
              <div className="hidden sm:flex items-center gap-1.5 font-barlow text-[12px] text-[#111] px-1">
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
        <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      </>
    );
  }

  // Solid header for inner pages
  return (
    <>
      <header className="sticky top-0 inset-x-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="container flex items-center justify-between py-5">
          <Link to="/" className="font-display text-2xl tracking-[0.4em] text-foreground">DSOM</Link>
          <nav className="hidden md:flex items-center gap-10 text-[11px] tracking-luxe uppercase">
            <Link to="/catalog" className={`hover:text-accent transition-colors ${pathname.startsWith("/catalog") ? "text-accent" : ""}`}>{t("nav.catalog")}</Link>
            <Link to="/page/about" className="hover:text-accent transition-colors">{t("nav.about")}</Link>
            <Link to="/page/stores" className="hover:text-accent transition-colors">{t("nav.stores")}</Link>
            <Link to="/page/contact" className="hover:text-accent transition-colors">{t("nav.contact")}</Link>
          </nav>
          <div className="flex items-center gap-3 text-[11px] tracking-luxe uppercase">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            <Link to="/favorites" aria-label="Favorites" className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <Heart className="w-4 h-4" />
            </Link>
            <span className="text-border">·</span>
            <button onClick={() => switchLang("ru")} className={i18n.language === "ru" ? "text-accent" : "text-muted-foreground hover:text-foreground"}>RU</button>
            <span className="text-border">·</span>
            <button onClick={() => switchLang("en")} className={i18n.language === "en" ? "text-accent" : "text-muted-foreground hover:text-foreground"}>EN</button>
          </div>
        </div>
      </header>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Header;
