import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductLite } from "@/components/ProductCard";
import QuickViewDialog from "@/components/QuickViewDialog";
import { SKIN_TYPES } from "@/lib/skinTypes";

interface Cat { id: string; slug: string; name: string; name_en: string | null; parent_id: string | null }

type SortKey = "new" | "price_asc" | "price_desc";

const Catalog = () => {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const activeCat = params.get("cat") || "all";
  const sort = (params.get("sort") as SortKey) || "new";
  const skin = params.get("skin") || "";

  const [cats, setCats] = useState<Cat[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);
  const [mobileCols, setMobileCols] = useState<1 | 2>(1);

  useEffect(() => {
    supabase.from("categories").select("id,slug,name,name_en,parent_id").eq("is_visible", true).is("parent_id", null).order("sort_order")
      .then(({ data }) => setCats((data || []) as Cat[]));
  }, []);

  useEffect(() => {
    (async () => {
      let q = supabase.from("products").select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new,category_id").eq("is_visible", true);
      if (activeCat !== "all") {
        const cat = cats.find((c) => c.slug === activeCat);
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (skin) q = q.contains("skin_types", [skin]);
      if (sort === "price_asc") q = q.order("price", { ascending: true });
      else if (sort === "price_desc") q = q.order("price", { ascending: false });
      else q = q.order("is_new", { ascending: false }).order("sort_order");
      const { data } = await q;
      const list = (data || []) as ProductLite[];

      // Fetch additional images for all products in one query
      if (list.length > 0) {
        const ids = list.map((p) => p.id);
        const { data: imgs } = await supabase
          .from("product_images")
          .select("product_id,url,sort_order")
          .in("product_id", ids)
          .order("sort_order");
        const byProduct = new Map<string, string[]>();
        (imgs || []).forEach((row: any) => {
          const arr = byProduct.get(row.product_id) || [];
          arr.push(row.url);
          byProduct.set(row.product_id, arr);
        });
        list.forEach((p) => { p.images = byProduct.get(p.id) || []; });
      }

      setProducts(list);
    })();
  }, [activeCat, sort, skin, cats]);

  const lang = i18n.language;
  const visibleCats = useMemo(() => [{ slug: "all", name: t("catalog.all"), name_en: t("catalog.all") }, ...cats.map((c) => ({ slug: c.slug, name: c.name, name_en: c.name_en }))], [cats, t]);

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v === "all" || v === "new" || v === "") p.delete(k); else p.set(k, v);
    if (k === "cat" && v !== "all") p.set("cat", v);
    setParams(p, { replace: true });
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border/60">
        <div className="container py-14 md:py-20">
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-4">— {t("catalog.title")}</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            {lang === "en" ? "Skincare with" : "Уход с архитектурой"}
            <br />
            <span className="italic">{lang === "en" ? "formula architecture" : "формул"}</span>
          </h1>
        </div>
      </section>

      {/* Sticky horizontal category tabs */}
      <div className="sticky top-[68px] z-30 bg-background/90 backdrop-blur-xl border-b border-border/60">
        <div className="container flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 py-3 md:py-4">
          <div className="flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1">
            {visibleCats.map((c) => {
              const label = lang === "en" && c.name_en ? c.name_en : c.name;
              const active = activeCat === c.slug;
              return (
                <button
                  key={c.slug}
                  onClick={() => setParam("cat", c.slug)}
                  className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-[11px] tracking-luxe uppercase transition-colors ${
                    active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 md:gap-4 shrink-0 text-[11px] tracking-luxe uppercase self-end md:self-auto ml-auto">
            <select
              value={skin}
              onChange={(e) => setParam("skin", e.target.value)}
              className="bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-0 underline underline-offset-4 decoration-foreground/30"
              aria-label={lang === "en" ? "Skin type" : "Тип кожи"}
            >
              <option value="">{lang === "en" ? "All skin types" : "Любой тип кожи"}</option>
              {SKIN_TYPES.map((s) => (
                <option key={s.value} value={s.value}>{lang === "en" ? s.en : s.ru}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-0 underline underline-offset-4 decoration-foreground/30"
            >
              <option value="new">{t("catalog.sortNew")}</option>
              <option value="price_asc">{t("catalog.sortPriceAsc")}</option>
              <option value="price_desc">{t("catalog.sortPriceDesc")}</option>
            </select>

            {/* Mobile-only density toggle — moved to far right */}
            <div className="md:hidden flex items-center gap-0.5 ml-1">
              <button
                onClick={() => setMobileCols(1)}
                aria-label={lang === "en" ? "One column" : "В один ряд"}
                aria-pressed={mobileCols === 1}
                className={`grid place-items-center w-7 h-7 rounded-full transition-colors ${
                  mobileCols === 1 ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMobileCols(2)}
                aria-label={lang === "en" ? "Two columns" : "В два ряда"}
                aria-pressed={mobileCols === 2}
                className={`grid place-items-center w-7 h-7 rounded-full transition-colors ${
                  mobileCols === 2 ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="py-16 md:py-20">
        <div className="container">
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground italic font-display text-2xl py-24">{t("catalog.empty")}</p>
          ) : (
            <div
              className={`grid ${
                mobileCols === 2 ? "grid-cols-2 gap-x-4 gap-y-10" : "grid-cols-1 gap-y-16"
              } sm:grid-cols-2 sm:gap-x-8 sm:gap-y-16 lg:grid-cols-3`}
            >
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} onQuickView={setQuickSlug} />)}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <QuickViewDialog slug={quickSlug} onClose={() => setQuickSlug(null)} />
    </main>
  );
};

export default Catalog;
