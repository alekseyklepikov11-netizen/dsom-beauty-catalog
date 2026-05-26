import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBanner } from "@/hooks/useBanner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductLite } from "@/components/ProductCard";
import QuickViewDialog from "@/components/QuickViewDialog";
import PromoStrip from "@/components/PromoStrip";
import PromoGate from "@/components/PromoGate";
import { LAUNCH_CONFIG, currentPhase } from "@/lib/launchConfig";
import RecentlyViewed from "@/components/RecentlyViewed";
import SocialProof from "@/components/SocialProof";
import SEO from "@/components/SEO";
import { track } from "@/lib/analytics";

interface Banner {
  id: string;
  title: string; title_en: string | null;
  subtitle: string | null; subtitle_en: string | null;
  cta_label: string | null; cta_label_en: string | null;
  cta_url: string | null;
  image_url: string | null; video_url: string | null;
  ab_group: string | null;
  text_position?: string | null;
  image_srcset?: Record<string, string> | null;
  image_focal_point?: string | null;
}
const FALLBACK_VIDEO = "https://cdn.coverr.co/videos/coverr-pouring-cosmetic-cream-into-a-jar-9419/1080p.mp4";

// 9-зон сетка для позиции текста на hero вынесена в lib/banner-positions.ts
// (там корректные оси для row-flex: items-* = vertical, justify-* = horizontal).
import { POS_CLASSES as HERO_POS_CLASSES, POS_GRADIENT as HERO_POS_GRADIENT, DEFAULT_POS, isValidPos } from "@/lib/banner-positions";

const Index = () => {
  // /intro daily-redirect отключён 26.05.2026 по запросу — главная теперь сразу
  // показывает hero-баннер из БД, без промежуточного экрана.
  // (страница /intro остаётся доступной как самостоятельный URL для прямого захода)

  const { t, i18n } = useTranslation();
  const bannerState = useBanner("home_hero");
  const banner = bannerState.status === "ready" ? (bannerState.banner as Banner | null) : null;
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);

  // Bestsellers — отдельный fetch, не относится к hero
  useEffect(() => {
    (async () => {
      const p = await supabase.from("products").select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new").eq("is_visible", true).eq("is_bestseller", true).order("sort_order").limit(6);
      setProducts((p.data || []) as ProductLite[]);
    })();
  }, []);

  const lang = i18n.language;
  const title = banner ? (lang === "en" && banner.title_en ? banner.title_en : banner.title) : t("hero.title1");
  const subtitle = banner ? (lang === "en" && banner.subtitle_en ? banner.subtitle_en : banner.subtitle) : t("hero.title2");
  const ctaLabel = banner ? (lang === "en" && banner.cta_label_en ? banner.cta_label_en : banner.cta_label) || t("hero.cta") : t("hero.cta");
  const videoSrc = banner?.video_url || FALLBACK_VIDEO;

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={lang === "en" ? "Skincare with formula architecture" : "Уход, рождённый наукой"}
        description={lang === "en"
          ? "DSOM — curated cosmetics for those who treat skincare as a daily ritual."
          : "DSOM — кураторская косметика. Ритуал красоты, что становится культом."}
      />
      <Header floating />

      {/* HERO with full-bleed video background — Logoisum style.
          Текст и кнопки реально позиционируются по banner.text_position через flex
          parent + text-align в дочерних элементах (раньше mx-auto перебивало это). */}
      {(() => {
        const heroPos = (banner?.text_position && HERO_POS_CLASSES[banner.text_position]) ? banner.text_position : "middle-center";
        const heroGrad = HERO_POS_GRADIENT[heroPos] || HERO_POS_GRADIENT["middle-center"];
        const [vertical, horizontal] = heroPos.split("-"); // "middle", "right"
        const textAlign = horizontal === "left" ? "text-left" : horizontal === "right" ? "text-right" : "text-center";
        const ctaJustify = horizontal === "left" ? "justify-start" : horizontal === "right" ? "justify-end" : "justify-center";
        return (
      <section className={`relative min-h-[100vh] flex overflow-hidden bg-[#0a0a0a] ${HERO_POS_CLASSES[heroPos]}`}>
        <video
          autoPlay muted loop playsInline preload="auto"
          poster={banner?.image_url || undefined}
          style={{ objectPosition: banner?.image_focal_point || "center center" }}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Виньетка ориентирована под зону текста */}
        <div className={`absolute inset-0 ${heroGrad} pointer-events-none`} />

        <div className={`relative px-6 md:px-12 lg:px-20 pt-32 pb-20 max-w-2xl lg:max-w-3xl w-full animate-fade-up ${textAlign}`}>
          {/* Eyebrow */}
          <p className="font-barlow font-medium text-[12px] tracking-[0.3em] uppercase text-white/80 mb-8">
            — {t("hero.eyebrow")}
          </p>

          {/* Headline — из banner.title. Если есть «|» — двухстрочная вёрстка с italic 2-й строкой */}
          {(() => {
            const splitIdx = title.indexOf("|");
            if (splitIdx > 0) {
              const line1 = title.slice(0, splitIdx).trim();
              const line2 = title.slice(splitIdx + 1).trim();
              return (
                <h1 className="text-white">
                  <span className="block font-barlow font-medium text-[clamp(2.5rem,6vw,5rem)] leading-[1] tracking-[-0.04em]">{line1}</span>
                  <span className="block font-serif italic text-[clamp(3rem,7vw,6rem)] leading-[1.05] -mt-1 md:-mt-2">{line2}</span>
                </h1>
              );
            }
            return (
              <h1 className="text-white font-barlow font-medium text-[clamp(2.5rem,6vw,5rem)] leading-[1.05] tracking-[-0.04em]">
                {title}
              </h1>
            );
          })()}

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-8 font-barlow font-medium text-[16px] md:text-[18px] text-white/85 leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* CTAs — выравнивание совпадает с зоной текста */}
          <div className={`mt-10 flex flex-wrap items-center gap-3 ${ctaJustify}`}>
            {/* Primary — white pill with play */}
            <a
              href="#promo"
              onClick={(e) => {
                banner && track("banner_click", { banner_id: banner.id, value: banner.ab_group || "default" });
                e.preventDefault();
                document.getElementById("promo")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="group inline-flex items-center gap-3 bg-white text-[#111] rounded-full pl-2 pr-7 py-2 font-barlow font-medium text-[14px] hover:bg-white/90 transition-colors"
            >
              <span className="grid place-items-center w-10 h-10 rounded-full bg-[#111] text-white">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </span>
              <span>{lang === "en" ? `Get ${currentPhase() === "launch" ? LAUNCH_CONFIG.launchDiscountPercent : LAUNCH_CONFIG.welcomeDiscountPercent}% promocode` : `Получить промокод ${currentPhase() === "launch" ? LAUNCH_CONFIG.launchDiscountPercent : LAUNCH_CONFIG.welcomeDiscountPercent}%`}</span>
            </a>

            {/* Secondary — ghost outlined */}
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 bg-transparent text-white rounded-full px-6 py-3 font-barlow font-medium text-[14px] border border-white/40 hover:bg-white/10 transition-colors"
            >
              <span>{lang === "en" ? "View formulas" : "Посмотреть формулы"}</span>
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-barlow text-[10px] tracking-[0.3em] uppercase text-white/60">
          {lang === "en" ? "Scroll" : "Листайте"} ↓
        </div>
      </section>
        );
      })()}

      {/* BESTSELLERS */}
      <section className="py-24 md:py-32">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-luxe uppercase text-accent mb-5">— {t("sections.bestsellers")}</p>
            <h2 className="font-display text-5xl md:text-6xl">{lang === "en" ? "Our line" : "Наша линейка"}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} onQuickView={setQuickSlug} />)}
          </div>
          <div className="text-center mt-16">
            <Link to="/catalog" className="text-[11px] tracking-luxe uppercase border-b border-foreground pb-1">
              {t("sections.all")} →
            </Link>
          </div>
        </div>
      </section>

      {/* PROMO GATE — Telegram + email funnel (собрание 19.05) */}
      <section id="promo" className="py-20 md:py-28 bg-muted/30 scroll-mt-20">
        <div className="container max-w-2xl">
          {(() => {
            const ph = currentPhase();
            const pct = ph === "launch" ? LAUNCH_CONFIG.launchDiscountPercent : LAUNCH_CONFIG.welcomeDiscountPercent;
            return (
              <div className="text-center mb-10">
                <p className="text-[11px] tracking-luxe uppercase text-accent mb-5">— {lang === "en" ? (ph === "launch" ? "Launch offer" : "Welcome offer") : (ph === "launch" ? "Стартовая акция" : "Приветственная скидка")}</p>
                <h2 className="font-display text-4xl md:text-5xl mb-4">
                  {lang === "en" ? "Be the first on launch day" : "Будьте первыми на старте"}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {lang === "en"
                    ? `Get ${pct}% off on Ozon. We'll notify you on launch.`
                    : `Скидка ${pct}% на первый заказ на Ozon. Напомним за день до старта.`}
                </p>
              </div>
            );
          })()}
          <PromoGate variant="card" source="hero" />
        </div>
      </section>

      {/* PROMO CODES */}
      <PromoStrip />

      {/* SOCIAL PROOF — reviews from real customers */}
      <SocialProof />

      {/* RECENTLY VIEWED */}
      <RecentlyViewed />

      {/* BRANDS section removed — DSOM is a mono-brand; multi-brand carousel was misleading */}

      <Footer />

      <QuickViewDialog slug={quickSlug} onClose={() => setQuickSlug(null)} />
    </main>
  );
};

export default Index;
