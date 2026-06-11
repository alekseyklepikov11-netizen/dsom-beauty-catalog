import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
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
import PromoGate from "@/components/PromoGate";
import { LAUNCH_CONFIG, currentPhase } from "@/lib/launchConfig";
import { track } from "@/lib/analytics";
import { addRecentlyViewed } from "@/lib/recentlyViewed";

// FAQ блок — короткий, общий для всех 4 продуктов DSOM
const PRODUCT_FAQS_RU = [
  { q: "Когда стартуют продажи?", a: "В июле 2026 года, эксклюзивно на Ozon. Подпишитесь на промокод выше — напомним за день до старта." },
  { q: "Где производится?", a: "В России, по нашим спецификациям. Все продукты сертифицированы; реквизиты юр.лица и регистрационные документы — в публичной оферте на dsom.ru/page/oferta." },
  { q: "Есть ли отдушка?", a: "Да, в составе есть лёгкая отдушка. Мы не делаем «100% без отдушек» из принципа честной коммуникации." },
  { q: "Можно ли использовать беременным и кормящим?", a: "Ретинол (P2 Renew) — нет. Vitamin C, PDRN, ламеллярный крем — возможно, но рекомендуем согласовать с врачом." },
  { q: "Подходит ли для чувствительной кожи?", a: "P3 Lift и P4 Hydro — да. P1 Glow и P2 Renew — начинать постепенно (1-2 раза в неделю)." },
  { q: "Сколько хватает одной упаковки?", a: "30 мл сыворотки — на 2-3 месяца при ежедневном использовании. 50 мл крема — на 1.5-2 месяца." },
];
const PRODUCT_FAQS_EN = [
  { q: "When does it launch?", a: "July 2026, exclusively on Ozon. Subscribe to the promo above — we'll remind you the day before." },
  { q: "Where is it made?", a: "In Russia. The EAEU compliance declaration is registered to LLC WALCANDVIR — we are responsible for every product." },
  { q: "Is there fragrance?", a: "Yes, a light fragrance is added. We don't claim '100% fragrance-free' on principle." },
  { q: "Safe during pregnancy?", a: "Retinol (P2 Renew) — no. Vitamin C, PDRN, lamellar cream — possibly, but consult your doctor." },
  { q: "Sensitive skin?", a: "P3 Lift and P4 Hydro — yes. P1 Glow and P2 Renew — start 1-2 times per week." },
  { q: "How long does one bottle last?", a: "30 ml serum — 2-3 months at daily use. 50 ml cream — 1.5-2 months." },
];

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
  const [activeIdx, setActiveIdx] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"description" | "ingredients" | "how_to_use">("description");
  const [brandName, setBrandName] = useState<string | null>(null);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      // Reset state when navigating to a different product to avoid stale images/links
      setProduct(null);
      setImages([]);
      setLinks([]);
      setStores([]);
      setActiveIdx(0);
      setBrandName(null);
      if (galleryRef.current) galleryRef.current.scrollLeft = 0;

      const { data: p } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (!p) return;
      setProduct(p as Product);

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

  const gallery = Array.from(
    new Set([product.cover_image_url, ...images.map((i) => i.url)].filter(Boolean) as string[])
  );

  const faqList = lang === "en" ? PRODUCT_FAQS_EN : PRODUCT_FAQS_RU;
  const productLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name,
    description: description || subtitle || name,
    image: gallery,
    sku: product.slug,
    brand: brandName ? { "@type": "Brand", name: brandName } : { "@type": "Brand", name: "DSOM" },
    offers: {
      "@type": "Offer",
      url: typeof window !== "undefined" ? window.location.href : undefined,
      priceCurrency: "RUB",
      price: Number(product.price),
      availability: links.length > 0 ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
    },
  };
  const faqLd = {
    "@context": "https://schema.org/",
    "@type": "FAQPage",
    mainEntity: faqList.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const jsonLd = [productLd, faqLd];

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
            <div className="group relative bg-secondary aspect-[4/5] overflow-hidden">
              <div
                ref={galleryRef}
                className="h-full snap-x snap-mandatory overflow-x-auto scroll-smooth flex"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round(el.scrollLeft / el.clientWidth);
                  if (idx !== activeIdx && idx >= 0 && idx < gallery.length) setActiveIdx(idx);
                }}
              >
                {gallery.map((g, i) => (
                  <div
                    key={`${g}-${i}`}
                    className="relative w-full h-full flex-shrink-0 snap-center snap-always"
                    style={{ minWidth: "100%" }}
                  >
                    <img src={g} alt={name} loading={i === 0 ? "eager" : "lazy"} decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {(product.is_bestseller || product.is_new) && (
                <span className="absolute top-5 left-5 bg-background/90 backdrop-blur px-3 py-1 text-[10px] tracking-luxe uppercase z-10">
                  {product.is_new ? t("product.new") : t("product.bestseller")}
                </span>
              )}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => {
                      const el = galleryRef.current;
                      if (!el) return;
                      el.scrollTo({ left: Math.max(0, activeIdx - 1) * el.clientWidth, behavior: "smooth" });
                    }}
                    disabled={activeIdx === 0}
                    className="hidden md:grid absolute top-1/2 -translate-y-1/2 left-3 z-10 place-items-center w-10 h-10 rounded-full bg-background/85 backdrop-blur-md text-foreground opacity-0 group-hover:opacity-100 transition hover:bg-background disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => {
                      const el = galleryRef.current;
                      if (!el) return;
                      el.scrollTo({ left: Math.min(gallery.length - 1, activeIdx + 1) * el.clientWidth, behavior: "smooth" });
                    }}
                    disabled={activeIdx === gallery.length - 1}
                    className="hidden md:grid absolute top-1/2 -translate-y-1/2 right-3 z-10 place-items-center w-10 h-10 rounded-full bg-background/85 backdrop-blur-md text-foreground opacity-0 group-hover:opacity-100 transition hover:bg-background disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
                    {gallery.map((_, i) => (
                      <span
                        key={`dot-${i}`}
                        className={`h-1 rounded-full transition-all duration-300 ${activeIdx === i ? "w-6 bg-foreground" : "w-1.5 bg-foreground/40"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {gallery.map((g, i) => (
                  <button
                    key={`thumb-${i}`}
                    onClick={() => {
                      setActiveIdx(i);
                      const el = galleryRef.current;
                      if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
                    }}
                    aria-label="Show image"
                    className={`relative aspect-square bg-secondary overflow-hidden rounded-sm transition-all ${
                      activeIdx === i
                        ? "ring-1 ring-foreground opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={g} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
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
              {links.length > 0 ? (
                <>
                  <div className="flex flex-col gap-2.5 max-w-md">
                    {links.map((l) => <MarketplaceButton key={l.id} kind={l.kind} url={l.url} label={l.label} productId={product.id} />)}
                  </div>
                  <div className="max-w-md mt-3">
                    <StockAlertDialog productId={product.id} productName={name} />
                  </div>
                </>
              ) : (
                <div className="max-w-md">
                  <p className="text-sm text-muted-foreground mb-4 italic">
                    {(() => {
                      const ph = currentPhase();
                      const pct = ph === "launch" ? LAUNCH_CONFIG.launchDiscountPercent : LAUNCH_CONFIG.welcomeDiscountPercent;
                      return lang === "en"
                        ? `Launch on Ozon. Get a ${pct}% promocode now.`
                        : `Старт продаж на Ozon. Получите промокод ${pct}% уже сейчас.`;
                    })()}
                  </p>
                  <PromoGate variant="card" source={`product:${product.slug}`} />
                </div>
              )}
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

        {/* FAQ — отдельный блок с FAQPage JSON-LD */}
        <div className="max-w-3xl mx-auto mt-24 pt-12 border-t border-border">
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-4 text-center">— FAQ</p>
          <h2 className="font-display text-3xl md:text-4xl text-center mb-10">
            {lang === "en" ? "Frequently asked" : "Частые вопросы"}
          </h2>
          <div className="space-y-2">
            {faqList.map((f, i) => (
              <details key={i} className="group border border-border rounded-xl px-5 py-4 open:bg-muted/30 transition-colors">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 font-display text-lg leading-snug">
                  {f.q}
                  <span className="text-accent text-2xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
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
