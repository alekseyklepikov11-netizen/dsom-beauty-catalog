import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductLite } from "@/components/ProductCard";
import QuickViewDialog from "@/components/QuickViewDialog";

interface Banner {
  title: string; title_en: string | null;
  subtitle: string | null; subtitle_en: string | null;
  cta_label: string | null; cta_label_en: string | null;
  cta_url: string | null;
  image_url: string | null; video_url: string | null;
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
        supabase.from("banners").select("*").eq("position", "home_hero").eq("is_active", true).order("sort_order").limit(1).maybeSingle(),
        supabase.from("products").select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new").eq("is_visible", true).eq("is_bestseller", true).order("sort_order").limit(6),
        supabase.from("brands").select("id,slug,name,country").eq("is_visible", true).order("sort_order"),
      ]);
      setBanner(b.data as Banner | null);
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
      <Header floating />

      {/* HERO with full-bleed video background */}
      <section className="relative min-h-[100vh] flex items-end overflow-hidden">
        <video
          autoPlay muted loop playsInline preload="auto"
          poster={banner?.image_url || undefined}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
          {banner?.image_url && <img src={banner.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        </video>

        {/* Soft cream gradient at bottom for text legibility, no heavy color overlay */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-foreground/20 to-transparent" />

        <div className="relative container pb-24 md:pb-32 pt-40">
          <div className="max-w-3xl animate-fade-up">
            <p className="text-[11px] tracking-luxe uppercase text-foreground/70 mb-6">{t("hero.eyebrow")}</p>
            <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.95] text-foreground">
              {title}
              <br />
              <span className="italic text-accent">{subtitle?.split(".")[0]}</span>
            </h1>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to={banner?.cta_url || "/catalog"}
                className="inline-flex items-center gap-2 bg-foreground text-background rounded-full pl-6 pr-2 py-2 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
              >
                <span>{ctaLabel}</span>
                <span className="grid place-items-center w-9 h-9 rounded-full bg-background/15">→</span>
              </Link>
              <button className="inline-flex items-center gap-3 bg-background/85 backdrop-blur-md text-foreground rounded-full pl-2 pr-6 py-2 text-[11px] tracking-luxe uppercase border border-foreground/5 hover:bg-background transition-colors">
                <span className="grid place-items-center w-9 h-9 rounded-full bg-foreground text-background">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </span>
                <span>{lang === "en" ? "Watch the ritual" : "Посмотреть ритуал"}</span>
              </button>
            </div>
          </div>
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
