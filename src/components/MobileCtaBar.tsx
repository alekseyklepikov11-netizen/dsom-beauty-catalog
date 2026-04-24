import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

/**
 * Sticky bottom CTA on mobile. Appears after the user scrolls past the hero
 * area. Hidden on /admin and /auth routes and on desktop (md+).
 */
const MobileCtaBar = () => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/product/"); // product page already has its own CTAs
  if (hidden) return null;

  const label = i18n.language === "en" ? "Shop the catalog" : "В магазин";

  return (
    <div
      className={`md:hidden fixed bottom-4 left-4 right-4 z-50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      <Link
        to="/catalog"
        className="flex items-center justify-center gap-3 w-full bg-foreground text-background rounded-full py-4 text-[12px] tracking-luxe uppercase shadow-lg hover:bg-accent transition-colors"
      >
        <ShoppingBag className="w-4 h-4" />
        <span>{label}</span>
      </Link>
    </div>
  );
};

export default MobileCtaBar;
