import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const Header = () => {
  const { t, i18n } = useTranslation();
  const switchLang = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("dsom-lang", lng);
  };

  return (
    <header className="absolute top-0 inset-x-0 z-30">
      <div className="container flex items-center justify-between py-7">
        <Link to="/" className="font-display text-2xl tracking-[0.4em] text-foreground">DSOM</Link>
        <nav className="hidden md:flex items-center gap-10 text-[11px] tracking-luxe uppercase">
          <Link to="/catalog" className="hover:text-accent transition-colors">{t("nav.catalog")}</Link>
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
