import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductLite } from "@/components/ProductCard";

interface Banner { title: string; title_en: string | null; subtitle: string | null; subtitle_en: string | null; cta_label: string | null; cta_url: string | null; image_url: string | null; }
interface Brand { id: string; slug: string; name: string; country: string | null; }

const Index = () => {
  const { t, i18n } = useTranslation();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

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
  const title = banner ? (lang === "en" && banner.title_en ? banner.title_en : banner.title) : "";
  const subtitle = banner ? (lang === "en" && banner.subtitle_en ? banner.subtitle_en : banner.subtitle) : "";

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="relative min-h-screen flex items-end overflow-hidden grain">
        {banner?.image_url && <img src={banner.image_url} alt={title} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
        <div className="relative container pb-20 md:pb-28 pt-40">
          <div className="max-w-3xl animate-fade-up">
            <p className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-6">DSOM · Лаборатория ухода</p>
            <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.95]">
              {title || "Чистая наука."}<br/><span className="italic text-accent">{subtitle?.split(".")[0] || "Бережный ритуал"}</span>
            </h1>
            <Link to={banner?.cta_url || "/catalog"} className="mt-10 inline-flex items-center gap-3 text-[11px] tracking-luxe uppercase">
              <span className="border-b border-foreground pb-1">{banner?.cta_label || t("hero.cta")}</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="container">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-luxe uppercase text-accent mb-5">— {t("sections.bestsellers")}</p>
            <h2 className="font-display text-5xl md:text-6xl">Любимые формулы</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
          <div className="text-center mt-16">
            <Link to="/catalog" className="text-[11px] tracking-luxe uppercase border-b border-foreground pb-1">Весь каталог →</Link>
          </div>
        </div>
      </section>

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
    </main>
  );
};

export default Index;
