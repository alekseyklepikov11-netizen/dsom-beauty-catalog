import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductLite } from "@/components/ProductCard";
import QuickViewDialog from "@/components/QuickViewDialog";
import PromoStrip from "@/components/PromoStrip";
import RecentlyViewed from "@/components/RecentlyViewed";
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
}
interface Brand { id: string; slug: string; name: string; country: string | null; }

const FALLBACK_VIDEO = "https://cdn.coverr.co/videos/coverr-pouring-cosmetic-cream-into-a-jar-9419/1080p.mp4";

const Index = () => {
  const { t, i18n } = useTranslation();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [b, p, br] = await Promise.all([
        supabase.from("banners").select("id,title,title_en,subtitle,subtitle_en,cta_label,cta_label_en,cta_url,image_url,video_url,ab_group").eq("position", "home_hero").eq("is_active", true).order("sort_order"),
        supabase.from("products").select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new").eq("is_visible", true).eq("is_bestseller", true).order("sort_order").limit(6),
        supabase.from("brands").select("id,slug,name,country").eq("is_visible", true).order("sort_order"),
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
      setBrands((br.data || []) as Brand[]);
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
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
        <video
          autoPlay muted loop playsInline preload="auto"
          poster={banner?.image_url || undefined}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Subtle vignette only — no heavy color overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/30 pointer-events-none" />

        <div className="relative container px-4 pt-32 pb-20 text-center animate-fade-up">
          {/* Eyebrow */}
          <p className="font-barlow font-medium text-[12px] tracking-[0.3em] uppercase text-white/80 mb-8">
            — {t("hero.eyebrow")}
          </p>

          {/* Headline — two lines, mixed typography */}
          <h1 className="text-white max-w-5xl mx-auto">
            <span className="block font-barlow font-medium text-[clamp(2.5rem,7vw,5.5rem)] leading-[1] tracking-[-0.04em]">
              {lang === "en" ? "Beauty rituals that" : "Ритуал красоты,"}
            </span>
            <span className="block font-serif italic text-[clamp(3rem,9vw,7rem)] leading-[1.05] -mt-1 md:-mt-2">
              {lang === "en" ? "go viral & timeless" : "что становится культом"}
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-8 font-barlow font-medium text-[16px] md:text-[18px] text-white/85 max-w-2xl mx-auto leading-relaxed">
            {lang === "en"
              ? "Curated cosmetics for those who treat skincare as a daily ritual — not a routine."
              : "Кураторская косметика для тех, кто относится к уходу как к ритуалу, а не рутине."}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {/* Primary — white pill with play */}
            <Link
              to={banner?.cta_url || "/catalog"}
              onClick={() => banner && track("banner_click", { banner_id: banner.id, value: banner.ab_group || "default" })}
              className="group inline-flex items-center gap-3 bg-white text-[#111] rounded-full pl-2 pr-7 py-2 font-barlow font-medium text-[14px] hover:bg-white/90 transition-colors"
            >
              <span className="grid place-items-center w-10 h-10 rounded-full bg-[#111] text-white">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </span>
              <span>{lang === "en" ? "See our catalogue" : "Смотреть каталог"}</span>
            </Link>

            {/* Secondary — ghost outlined */}
            <button className="inline-flex items-center gap-2 bg-transparent text-white rounded-full px-6 py-3 font-barlow font-medium text-[14px] border border-white/40 hover:bg-white/10 transition-colors">
              <span>{lang === "en" ? "Watch the ritual" : "Посмотреть ритуал"}</span>
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-barlow text-[10px] tracking-[0.3em] uppercase text-white/60">
          {lang === "en" ? "Scroll" : "Листайте"} ↓
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="py-24 md:py-32">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-luxe uppercase text-accent mb-5">— {t("sections.bestsellers")}</p>
            <h2 className="font-display text-5xl md:text-6xl">{lang === "en" ? "Beloved formulas" : "Любимые формулы"}</h2>
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

      {/* PROMO CODES */}
      <PromoStrip />

      {/* BRANDS */}
      <section className="py-20 bg-secondary/40">
        <div className="container">
          <p className="text-[11px] tracking-luxe uppercase text-accent text-center mb-10">— {t("sections.brands")}</p>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8">
            {brands.map((b) => (
              <div key={b.id} className="text-center">
                <p className="font-display text-3xl">{b.name}</p>
                {b.country && <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mt-2">{b.country}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <QuickViewDialog slug={quickSlug} onClose={() => setQuickSlug(null)} />
    </main>
  );
};

export default Index;
