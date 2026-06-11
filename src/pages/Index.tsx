import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
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
import { HeroBanner } from "@/components/HeroBanner";
import { HeroPromoCtas } from "@/components/HeroPromoCtas";

// 29.05.2026 — fallback video отключён: у нас теперь 3 кастомных hero-баннера
// (Эссенция / Линейка / Архитектура) с разными композициями для desktop + mobile.
// Если нужно вернуть — раскомментировать и передать в HeroBanner.fallbackVideo.
// const FALLBACK_VIDEO = "https://cdn.coverr.co/videos/coverr-pouring-cosmetic-cream-into-a-jar-9419/1080p.mp4";

const Index = () => {
  // /intro daily-redirect отключён 26.05.2026 по запросу пользователя — главная
  // теперь сразу показывает hero-баннер из БД, без промежуточного экрана.
  // (страница /intro остаётся доступной как самостоятельный URL для прямого захода)

  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const bannerState = useBanner("home_hero");
  const banner = bannerState.status === "ready" ? bannerState.banner : null;

  // Bestsellers — отдельный fetch, не относится к hero
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const p = await supabase
        .from("products")
        .select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new")
        .eq("is_visible", true)
        .eq("is_bestseller", true)
        .order("sort_order")
        .limit(6);
      setProducts((p.data || []) as ProductLite[]);
    })();
  }, []);

  // Для двуязычного fallback при отсутствии активного баннера
  const fallbackTitle = lang === "en" ? "Active cosmetics | with transparent formulas" : "Активная косметика | с прозрачным составом";
  const fallbackSubtitle = lang === "en"
    ? "Vitamin C 2000 ppm. Retinol 0.3%. PDRN 0.1%. Concentrations on the label — no marketing tricks. Launch in July 2026, available on Ozon."
    : "Vitamin C 2000 ppm. Ретинол 0.3%. PDRN 0.1%. Концентрации указаны — без маркетинговых уловок. Запуск в июле 2026, стартуем на Ozon.";

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={lang === "en" ? "Skincare with formula architecture" : "Уход, рождённый наукой"}
        description={lang === "en"
          ? "DSOM — curated cosmetics for those who treat skincare as a daily ritual."
          : "DSOM — кураторская косметика. Ритуал красоты, что становится культом."}
      />
      <Header floating />

      <HeroBanner
        state={bannerState}
        variant="fullscreen"
        fallbackTitle={fallbackTitle}
        fallbackSubtitle={fallbackSubtitle}
        eyebrow={`— ${t("hero.eyebrow")}`}
        cta={<HeroPromoCtas bannerId={banner?.id} abGroup={banner?.ab_group} />}
        showScrollCue
        scrollCueLabel={lang === "en" ? "Scroll" : "Листайте"}
      />

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

      {/* PROMO GATE — Telegram + email funnel */}
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

      <PromoStrip />
      <SocialProof />
      <RecentlyViewed />

      <Footer />

      <QuickViewDialog slug={quickSlug} onClose={() => setQuickSlug(null)} />
    </main>
  );
};

export default Index;
