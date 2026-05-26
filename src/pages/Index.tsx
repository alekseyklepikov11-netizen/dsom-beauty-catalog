import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
}
const FALLBACK_VIDEO = "https://cdn.coverr.co/videos/coverr-pouring-cosmetic-cream-into-a-jar-9419/1080p.mp4";

// 9-зон сетка для позиции текста на hero (см. таблица banners.text_position)
const HERO_POS_CLASSES: Record<string, string> = {
  "top-left":      "items-start    justify-start  text-left",
  "top-center":    "items-center   justify-start  text-center",
  "top-right":     "items-end      justify-start  text-right",
  "middle-left":   "items-start    justify-center text-left",
  "middle-center": "items-center   justify-center text-center",
  "middle-right":  "items-end      justify-center text-right",
  "bottom-left":   "items-start    justify-end    text-left",
  "bottom-center": "items-center   justify-end    text-center",
  "bottom-right":  "items-end      justify-end    text-right",
};

const HERO_POS_GRADIENT: Record<string, string> = {
  "top-left":      "bg-gradient-to-br from-black/60 via-black/15 to-transparent",
  "top-center":    "bg-gradient-to-b  from-black/55 via-black/10 to-transparent",
  "top-right":     "bg-gradient-to-bl from-black/60 via-black/15 to-transparent",
  "middle-left":   "bg-gradient-to-r  from-black/55 via-black/15 to-transparent",
  "middle-center": "bg-gradient-to-b  from-black/15 via-transparent to-black/30",
  "middle-right":  "bg-gradient-to-l  from-black/55 via-black/15 to-transparent",
  "bottom-left":   "bg-gradient-to-tr from-black/60 via-black/15 to-transparent",
  "bottom-center": "bg-gradient-to-t  from-black/55 via-black/10 to-transparent",
  "bottom-right":  "bg-gradient-to-tl from-black/60 via-black/15 to-transparent",
};

const Index = () => {
  const navigate = useNavigate();

  // Daily-first-visit redirect: первый заход за календарные сутки → на /intro.
  // Хранится дата последнего просмотра. Если сегодняшняя дата ≠ сохранённой —
  // редирект (новый день = новый показ презентации).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD по UTC
    const lastSeen = localStorage.getItem("dsom_intro_last_seen");
    if (lastSeen !== today) {
      navigate("/intro", { replace: true });
    }
  }, [navigate]);

  const { t, i18n } = useTranslation();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [b, p] = await Promise.all([
        supabase.from("banners").select("id,title,title_en,subtitle,subtitle_en,cta_label,cta_label_en,cta_url,image_url,video_url,ab_group,text_position,image_srcset").eq("position", "home_hero").eq("is_active", true).order("sort_order"),
        supabase.from("products").select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new").eq("is_visible", true).eq("is_bestseller", true).order("sort_order").limit(6),
      ]);
      // A/B: pick a random active banner for this position
      const banners = (b.data || []) as Banner[];
      let chosen: Banner | null = null;
      if (banners.length > 0) {
        chosen = banners[Math.floor(Math.random() * banners.length)];
        // Fire-and-forget impression
        track("banner_view", { banner_id: chosen.id, value: chosen.ab_group || "default" });
      }
      setBanner(chosen);
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

      {/* HERO with full-bleed video background — Logoisum style */}
      {(() => {
        const heroPos = (banner?.text_position && HERO_POS_CLASSES[banner.text_position]) ? banner.text_position : "middle-center";
        const heroGrad = HERO_POS_GRADIENT[heroPos] || HERO_POS_GRADIENT["middle-center"];
        return (
      <section className={`relative min-h-[100vh] flex overflow-hidden bg-[#0a0a0a] ${HERO_POS_CLASSES[heroPos]}`}>
        <video
          autoPlay muted loop playsInline preload="auto"
          poster={banner?.image_url || undefined}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Виньетка ориентирована под зону текста */}
        <div className={`absolute inset-0 ${heroGrad} pointer-events-none`} />

        <div className="relative container px-4 pt-32 pb-20 animate-fade-up">
          {/* Eyebrow */}
          <p className="font-barlow font-medium text-[12px] tracking-[0.3em] uppercase text-white/80 mb-8">
            — {t("hero.eyebrow")}
          </p>

          {/* Headline — two lines, mixed typography */}
          <h1 className="text-white max-w-5xl mx-auto">
            <span className="block font-barlow font-medium text-[clamp(2.5rem,7vw,5.5rem)] leading-[1] tracking-[-0.04em]">
              {lang === "en" ? "Active cosmetics" : "Активная косметика"}
            </span>
            <span className="block font-serif italic text-[clamp(3rem,9vw,7rem)] leading-[1.05] -mt-1 md:-mt-2">
              {lang === "en" ? "with transparent formulas" : "с прозрачным составом"}
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-8 font-barlow font-medium text-[16px] md:text-[18px] text-white/85 max-w-2xl mx-auto leading-relaxed">
            {lang === "en"
              ? "Vitamin C 2000 ppm. Retinol 0.3%. PDRN 0.1%. Concentrations on the label — no marketing tricks. Launch in June 2026, available on Ozon."
              : "Vitamin C 2000 ppm. Ретинол 0.3%. PDRN 0.1%. Концентрации указаны — без маркетинговых уловок. Запуск в июне 2026, стартуем на Ozon."}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
