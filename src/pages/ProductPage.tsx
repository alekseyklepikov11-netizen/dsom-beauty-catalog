import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MarketplaceButton from "@/components/MarketplaceButton";
import SEO from "@/components/SEO";
import ReviewsSection from "@/components/ReviewsSection";
import RelatedProducts from "@/components/RelatedProducts";
import RecentlyViewed from "@/components/RecentlyViewed";
import QuickViewDialog from "@/components/QuickViewDialog";
import StockAlertDialog from "@/components/StockAlertDialog";
import { track } from "@/lib/analytics";
import { addRecentlyViewed } from "@/lib/recentlyViewed";

interface Product {
  id: string; slug: string; name: string; name_en: string | null;
  subtitle: string | null; subtitle_en: string | null;
  description: string | null; description_en: string | null;
  ingredients: string | null; ingredients_en: string | null;
  how_to_use: string | null; how_to_use_en: string | null;
  price: number; volume: string | null; cover_image_url: string | null;
  is_bestseller: boolean; is_new: boolean;
  brand_id: string | null;
  category_id: string | null;
}
interface Img { id: string; url: string; alt: string | null }
interface MLink { id: string; kind: string; url: string; label: string | null }
interface Store { id: string; name: string; city: string; address: string }

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<Img[]>([]);
  const [links, setLinks] = useState<MLink[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [tab, setTab] = useState<"description" | "ingredients" | "how_to_use">("description");
  const [brandName, setBrandName] = useState<string | null>(null);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data: p } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (!p) return;
      setProduct(p as Product);
      setActiveImg((p as Product).cover_image_url);

      // Track product view + recently viewed (fire-and-forget)
      track("product_view", { product_id: (p as Product).id, value: (p as Product).slug });
      addRecentlyViewed((p as Product).id);

      const [imgs, mlinks, inv, brand] = await Promise.all([
        supabase.from("product_images").select("id,url,alt").eq("product_id", p.id).order("sort_order"),
        supabase.from("marketplace_links").select("id,kind,url,label").eq("product_id", p.id).eq("is_active", true),
        supabase.from("store_inventory").select("store_id, in_stock, stores(id,name,city,address,is_active)").eq("product_id", p.id).eq("in_stock", true),
        (p as Product).brand_id ? supabase.from("brands").select("name,name_en").eq("id", (p as Product).brand_id!).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setImages((imgs.data || []) as Img[]);
      setLinks((mlinks.data || []) as MLink[]);
      const storesList = ((inv.data || []) as any[])
        .map((r) => r.stores)
        .filter((s) => s && s.is_active);
      setStores(storesList as Store[]);
      if (brand.data) setBrandName((i18n.language === "en" && (brand.data as any).name_en) || (brand.data as any).name);
    })();
  }, [slug, i18n.language]);

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="container py-40 text-center text-muted-foreground tracking-luxe uppercase text-xs">…</div>
      </main>
    );
  }

  const lang = i18n.language;
  const name = lang === "en" && product.name_en ? product.name_en : product.name;
  const subtitle = lang === "en" && product.subtitle_en ? product.subtitle_en : product.subtitle;
  const description = lang === "en" && product.description_en ? product.description_en : product.description;
  const ingredients = lang === "en" && product.ingredients_en ? product.ingredients_en : product.ingredients;
  const howTo = lang === "en" && product.how_to_use_en ? product.how_to_use_en : product.how_to_use;

  const gallery = [product.cover_image_url, ...images.map((i) => i.url)].filter(Boolean) as string[];

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name,
    description: description || subtitle || name,
    image: gallery,
    sku: product.slug,
    brand: brandName ? { "@type": "Brand", name: brandName } : undefined,
    offers: {
      "@type": "Offer",
      url: typeof window !== "undefined" ? window.location.href : undefined,
      priceCurrency: "RUB",
      price: Number(product.price),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={name}
        description={(subtitle || description || "").slice(0, 160) || name}
        image={product.cover_image_url || undefined}
        type="product"
        jsonLd={jsonLd}
      />
      <Header />

      <div className="container pt-8 pb-4">
        <Link to="/catalog" className="text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-accent transition-colors">
          ← {t("product.back")}
        </Link>
      </div>

      <section className="container pb-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div>
            <div
              className="relative bg-secondary aspect-[4/5] overflow-hidden flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
              style={{ scrollbarWidth: "none" }}
              onScroll={(e) => {
                const el = e.currentTarget;
                const idx = Math.round(el.scrollLeft / el.clientWidth);
                if (gallery[idx] && gallery[idx] !== activeImg) setActiveImg(gallery[idx]);
              }}
              ref={(el) => {
                if (!el || !activeImg) return;
                const idx = gallery.indexOf(activeImg);
                const target = idx * el.clientWidth;
                if (Math.abs(el.scrollLeft - target) > 4) el.scrollTo({ left: target });
              }}
            >
              {gallery.map((g) => (
                <img
                  key={g}
                  src={g}
                  alt={name}
                  className="w-full h-full flex-none object-cover snap-center"
                />
              ))}
              {(product.is_bestseller || product.is_new) && (
                <span className="absolute top-5 left-5 bg-background/90 backdrop-blur px-3 py-1 text-[10px] tracking-luxe uppercase z-10">
                  {product.is_new ? t("product.new") : t("product.bestseller")}
                </span>
              )}
              {gallery.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {gallery.map((g) => (
                    <span
                      key={g}
                      className={`h-1 rounded-full transition-all ${activeImg === g ? "w-6 bg-foreground" : "w-1.5 bg-foreground/40"}`}
                    />
                  ))}
                </div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {gallery.map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveImg(g)}
                    aria-label="Show image"
                    className={`relative aspect-square bg-secondary overflow-hidden rounded-sm transition-all ${
                      activeImg === g
                        ? "ring-1 ring-foreground opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={g} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:pt-8">
            {brandName && <p className="text-[11px] tracking-luxe uppercase text-accent mb-4">{brandName}</p>}
            <h1 className="font-display text-5xl md:text-6xl leading-[0.98]">{name}</h1>
            {subtitle && <p className="font-display italic text-2xl text-muted-foreground mt-3">{subtitle}</p>}

            <div className="flex items-end justify-between mt-8 pb-8 border-b border-border">
              <p className="font-display text-4xl">{Number(product.price).toLocaleString(lang === "en" ? "en-US" : "ru-RU")} ₽</p>
              {product.volume && (
                <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">
                  {t("product.volume")}: {product.volume}
                </p>
              )}
            </div>

            {/* Marketplace buttons */}
            <div className="mt-8">
              <p className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-4">{t("product.marketplaces")}</p>
              <div className="flex flex-col gap-2.5 max-w-md">
                {links.length === 0 && <p className="text-sm text-muted-foreground italic">—</p>}
                {links.map((l) => <MarketplaceButton key={l.id} kind={l.kind} url={l.url} label={l.label} productId={product.id} />)}
              </div>
              <div className="max-w-md mt-3">
                <StockAlertDialog productId={product.id} productName={name} />
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-12">
              <div className="flex items-center gap-6 border-b border-border">
                {(["description", "ingredients", "how_to_use"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`pb-3 text-[11px] tracking-luxe uppercase border-b-2 -mb-px transition-colors ${tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    {t(`product.${k === "how_to_use" ? "howToUse" : k}`)}
                  </button>
                ))}
              </div>
              <div className="pt-6 text-sm leading-relaxed text-muted-foreground whitespace-pre-line min-h-[120px]">
                {tab === "description" && (description || "—")}
                {tab === "ingredients" && (ingredients || "—")}
                {tab === "how_to_use" && (howTo || "—")}
              </div>
            </div>

            {/* Offline stores */}
            {stores.length > 0 && (
              <div className="mt-12">
                <p className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-4">{t("product.offline")}</p>
                <ul className="divide-y divide-border border-y border-border">
                  {stores.map((s) => (
                    <li key={s.id} className="flex items-start gap-3 py-3">
                      <MapPin className="w-4 h-4 mt-1 text-accent shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.city} · {s.address}</p>
                      </div>
                      <Link to="/stores" className="text-[10px] tracking-luxe uppercase text-muted-foreground hover:text-accent self-center whitespace-nowrap">
                        {lang === "en" ? "On map" : "На карте"} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <ReviewsSection productId={product.id} />
      </section>

      <RelatedProducts
        productId={product.id}
        categoryId={product.category_id}
        brandId={product.brand_id}
        onQuickView={setQuickSlug}
      />

      <RecentlyViewed excludeId={product.id} />

      <Footer />
      <QuickViewDialog slug={quickSlug} onClose={() => setQuickSlug(null)} />
    </main>
  );
};

export default ProductPage;
