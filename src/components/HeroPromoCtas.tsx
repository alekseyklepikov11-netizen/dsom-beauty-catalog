// ============================================================
// HeroPromoCtas.tsx — CTAs (промокод + каталог) для hero на главной.
// ============================================================
// Извлечено из Index.tsx чтобы убрать лапшу из JSX и переиспользовать в
// HeroBanner через cta prop. Опционально трекает banner_click.
// ============================================================

import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LAUNCH_CONFIG, currentPhase } from "@/lib/launchConfig";
import { track } from "@/lib/analytics";

export interface HeroPromoCtasProps {
  /** Для tracking banner_click в analytics. */
  bannerId?: string;
  abGroup?: string | null;
}

export function HeroPromoCtas({ bannerId, abGroup }: HeroPromoCtasProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const phase = currentPhase();
  const discountPct = phase === "launch"
    ? LAUNCH_CONFIG.launchDiscountPercent
    : LAUNCH_CONFIG.welcomeDiscountPercent;

  return (
    <>
      {/* Primary — white pill with play icon, scrolls to #promo */}
      <a
        href="#promo"
        onClick={(e) => {
          if (bannerId) {
            try { track("banner_click", { banner_id: bannerId, value: abGroup || "default" }); } catch {}
          }
          e.preventDefault();
          document.getElementById("promo")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        className="group inline-flex items-center gap-3 bg-white text-[#111] rounded-full pl-2 pr-7 py-2 font-barlow font-medium text-[14px] hover:bg-white/90 transition-colors"
      >
        <span className="grid place-items-center w-10 h-10 rounded-full bg-[#111] text-white">
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        </span>
        <span>
          {lang === "en"
            ? `Get ${discountPct}% promocode`
            : `Получить промокод ${discountPct}%`}
        </span>
      </a>

      {/* Secondary — ghost outlined, link to /catalog */}
      <Link
        to="/catalog"
        className="inline-flex items-center gap-2 bg-transparent text-white rounded-full px-6 py-3 font-barlow font-medium text-[14px] border border-white/40 hover:bg-white/10 transition-colors"
      >
        <span>{lang === "en" ? "View formulas" : "Посмотреть формулы"}</span>
      </Link>
    </>
  );
}
