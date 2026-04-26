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
  const [overDark, setOverDark] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
      const footer = document.querySelector("footer");
      if (footer) {
        const rect = footer.getBoundingClientRect();
        // CTA sits ~bottom-4 (16px) + button height (~56px) → check ~90px from bottom
        const ctaY = window.innerHeight - 90;
        setOverDark(rect.top <= ctaY);
      } else {
        setOverDark(false);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  const hidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/catalog") ||
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
        className={`flex items-center justify-center gap-3 w-full rounded-full py-4 text-[12px] tracking-luxe uppercase shadow-lg transition-colors duration-500 ${
          overDark
            ? "bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            : "bg-foreground text-background hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        <ShoppingBag className="w-4 h-4" />
        <span>{label}</span>
      </Link>
    </div>
  );
};

export default MobileCtaBar;
