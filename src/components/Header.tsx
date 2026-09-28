import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Search, Heart, User, ShoppingBag } from "lucide-react";
import SearchDialog from "@/components/SearchDialog";
import MobileMenu from "@/components/MobileMenu";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { isCartEnabled } from "@/lib/launchConfig";

const Header = ({ floating = false }: { floating?: boolean }) => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { open: openCart, count: cartCount } = useCart();
  const showCart = isCartEnabled();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const accountHref = user ? "/account" : "/auth";

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
    try {
      localStorage.setItem("dsom-lang", lng);
    } catch {
      /* приватный режим — язык просто не запомнится */
    }
  };

  const cartLabel = cartCount > 0 ? t("a11y.cartCount", { count: cartCount }) : t("a11y.cart");
  const accountLabel = user ? t("nav.account") : t("nav.login");

  // Ссылка «Перейти к содержимому». Цель — #main-content сразу после шапки; запасной вариант — первый <main>.
  const skipToContent = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = (document.getElementById("main-content") || document.querySelector("main")) as HTMLElement | null;
    if (!target) return;
    e.preventDefault();
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  };

  const skipLink = (
    <a
      href="#main-content"
      onClick={skipToContent}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-foreground focus:text-background focus:px-5 focus:py-3 focus:text-[12px] focus:tracking-luxe focus:uppercase focus:outline-none focus:ring-2 focus:ring-accent"
    >
      {t("a11y.skip")}
    </a>
  );

  // Floating white pill navbar (used over hero video)
  if (floating) {
    return (
      <>
        {skipLink}
        <header className="fixed top-5 inset-x-0 z-50 px-4">
          <div className="mx-auto max-w-6xl rounded-[16px] bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.18)] py-2 pl-5 pr-2 flex items-center justify-between gap-4 xl:gap-6">
            <Link to="/" className="font-display text-[22px] tracking-[0.4em] text-[#111]">
              DSOM
            </Link>

            <nav className="hidden lg:flex items-center gap-5 xl:gap-6 font-barlow font-medium text-[13px] xl:text-[14px] text-[#111] whitespace-nowrap">
              <Link to="/catalog" className={`hover:opacity-60 transition-opacity ${pathname.startsWith("/catalog") ? "opacity-60" : ""}`}>{t("nav.catalog")}</Link>
              <Link to="/quiz" className={`hover:opacity-60 transition-opacity ${pathname.startsWith("/quiz") ? "opacity-60" : ""}`}>{t("nav.quiz")}</Link>
              <Link to="/page/about" className="hover:opacity-60 transition-opacity">{t("nav.about")}</Link>
              <Link to="/journal" className={`hover:opacity-60 transition-opacity ${pathname.startsWith("/journal") ? "opacity-60" : ""}`}>{t("nav.journal")}</Link>
              <Link to="/page/where-to-buy" className="hover:opacity-60 transition-opacity">{t("nav.stores")}</Link>
              <Link to="/page/contacts" className="hover:opacity-60 transition-opacity">{t("nav.contact")}</Link>
            </nav>

            <div className="flex items-center gap-0.5 shrink-0 min-w-0">
              <button
                type="button"
                data-search-trigger
                onClick={() => setSearchOpen(true)}
                aria-label={t("a11y.search")}
                className="inline-flex items-center justify-center w-11 lg:w-10 2xl:w-11 h-11 text-[#111] hover:opacity-60 transition-opacity"
              >
                <Search className="w-4 h-4" />
              </button>
              {showCart && (
                <button type="button" data-cart-trigger onClick={openCart} aria-label={cartLabel} className="relative inline-flex items-center justify-center w-11 lg:w-10 2xl:w-11 h-11 text-[#111] hover:opacity-60 transition-opacity">
                  <ShoppingBag className="w-4 h-4" />
                  {cartCount > 0 && <span aria-hidden="true" className="absolute top-1 right-1 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-[#222] text-white text-[10px] leading-none">{cartCount}</span>}
                </button>
              )}
              <Link to="/favorites" aria-label={t("a11y.favorites")} className="hidden sm:inline-flex items-center justify-center w-11 lg:w-10 2xl:w-11 h-11 text-[#111] hover:opacity-60 transition-opacity">
                <Heart className="w-4 h-4" />
              </Link>
              <Link to={accountHref} aria-label={accountLabel} className="hidden sm:inline-flex items-center justify-center w-11 lg:w-10 2xl:w-11 h-11 text-[#111] hover:opacity-60 transition-opacity">
                <User className="w-4 h-4" />
              </Link>
              <div className="hidden sm:flex items-center font-barlow text-[12px] text-[#111]" role="group" aria-label={t("a11y.language")}>
                <button type="button" lang="ru" aria-pressed={i18n.language === "ru"} onClick={() => switchLang("ru")} className={`min-w-[40px] min-h-[44px] px-1 ${i18n.language === "ru" ? "font-semibold" : "opacity-50 hover:opacity-100"}`}>RU</button>
                <span className="opacity-30" aria-hidden="true">/</span>
                <button type="button" lang="en" aria-pressed={i18n.language === "en"} onClick={() => switchLang("en")} className={`min-w-[40px] min-h-[44px] px-1 ${i18n.language === "en" ? "font-semibold" : "opacity-50 hover:opacity-100"}`}>EN</button>
              </div>
              <Link
                to="/catalog"
                aria-label={t("nav.shop")}
                className="group ml-1 inline-flex shrink-0 items-center gap-2.5 bg-[#222] text-white rounded-full pl-1.5 md:pl-5 lg:pl-1.5 xl:pl-5 pr-1.5 py-1.5 font-barlow font-medium text-[13px] whitespace-nowrap hover:bg-[#000] transition-colors"
              >
                <span className="hidden md:inline lg:hidden xl:inline">{t("nav.shop")}</span>
                <span className="grid place-items-center w-9 h-9 rounded-full bg-white text-[#222]">
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.2} />
                </span>
              </Link>
              <MobileMenu triggerClassName="text-[#111]" />
            </div>
          </div>
        </header>
        {/* Цель ссылки «Перейти к содержимому»: сразу после шапки, чтобы Tab дальше шёл в контент, а не снова в меню. */}
        <div id="main-content" tabIndex={-1} className="outline-none" />
        <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      </>
    );
  }

  // Solid header for inner pages
  return (
    <>
      {skipLink}
      <header className="sticky top-0 inset-x-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="container flex items-center justify-between gap-4 py-3.5">
          <Link to="/" className="font-display text-2xl tracking-[0.4em] text-foreground">DSOM</Link>
          <nav className="hidden lg:flex items-center gap-5 xl:gap-10 text-[11px] tracking-[0.16em] xl:tracking-luxe uppercase whitespace-nowrap">
            <Link to="/catalog" className={`hover:text-accent transition-colors ${pathname.startsWith("/catalog") ? "text-accent" : ""}`}>{t("nav.catalog")}</Link>
            <Link to="/quiz" className={`hover:text-accent transition-colors ${pathname.startsWith("/quiz") ? "text-accent" : ""}`}>{t("nav.quiz")}</Link>
            <Link to="/page/about" className="hover:text-accent transition-colors">{t("nav.about")}</Link>
            <Link to="/journal" className={`hover:text-accent transition-colors ${pathname.startsWith("/journal") ? "text-accent" : ""}`}>{t("nav.journal")}</Link>
            <Link to="/page/where-to-buy" className="hover:text-accent transition-colors">{t("nav.stores")}</Link>
            <Link to="/page/contacts" className="hover:text-accent transition-colors">{t("nav.contact")}</Link>
          </nav>
          <div className="flex items-center gap-0.5 text-[11px] tracking-luxe uppercase shrink-0 -mr-2">
            <button
              type="button"
              data-search-trigger
              onClick={() => setSearchOpen(true)}
              aria-label={t("a11y.search")}
              className="inline-flex items-center justify-center w-11 lg:w-10 xl:w-11 h-11 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            {showCart && (
              <button type="button" data-cart-trigger onClick={openCart} aria-label={cartLabel} className="relative inline-flex items-center justify-center w-11 lg:w-10 xl:w-11 h-11 text-muted-foreground hover:text-foreground transition-colors">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && <span aria-hidden="true" className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-1 grid place-items-center rounded-full bg-accent text-accent-foreground text-[9px] leading-none">{cartCount}</span>}
              </button>
            )}
            <Link to="/favorites" aria-label={t("a11y.favorites")} className="hidden sm:inline-flex items-center justify-center w-11 lg:w-10 xl:w-11 h-11 text-muted-foreground hover:text-foreground transition-colors">
              <Heart className="w-4 h-4" />
            </Link>
            <Link to={accountHref} aria-label={accountLabel} className="hidden sm:inline-flex items-center justify-center w-11 lg:w-10 xl:w-11 h-11 text-muted-foreground hover:text-foreground transition-colors">
              <User className="w-4 h-4" />
            </Link>
            <div className="hidden sm:flex items-center" role="group" aria-label={t("a11y.language")}>
              <span className="text-border" aria-hidden="true">·</span>
              <button type="button" lang="ru" aria-pressed={i18n.language === "ru"} onClick={() => switchLang("ru")} className={`min-w-[40px] min-h-[44px] px-1 ${i18n.language === "ru" ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}>RU</button>
              <span className="text-border" aria-hidden="true">·</span>
              <button type="button" lang="en" aria-pressed={i18n.language === "en"} onClick={() => switchLang("en")} className={`min-w-[40px] min-h-[44px] px-1 ${i18n.language === "en" ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}>EN</button>
            </div>
            <MobileMenu triggerClassName="text-foreground" />
          </div>
        </div>
      </header>
      {/* Цель ссылки «Перейти к содержимому»: сразу после шапки, чтобы Tab дальше шёл в контент, а не снова в меню. */}
      <div id="main-content" tabIndex={-1} className="outline-none" />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Header;
