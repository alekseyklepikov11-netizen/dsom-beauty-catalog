import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductLite } from "@/components/ProductCard";
import QuickViewDialog from "@/components/QuickViewDialog";

interface Cat { id: string; slug: string; name: string; name_en: string | null; parent_id: string | null }

type SortKey = "new" | "price_asc" | "price_desc";

const Catalog = () => {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const activeCat = params.get("cat") || "all";
  const sort = (params.get("sort") as SortKey) || "new";

  const [cats, setCats] = useState<Cat[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);

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
      if (sort === "price_asc") q = q.order("price", { ascending: true });
      else if (sort === "price_desc") q = q.order("price", { ascending: false });
      else q = q.order("is_new", { ascending: false }).order("sort_order");
      const { data } = await q;
      setProducts((data || []) as ProductLite[]);
    })();
  }, [activeCat, sort, cats]);

  const lang = i18n.language;
  const visibleCats = useMemo(() => [{ slug: "all", name: t("catalog.all"), name_en: t("catalog.all") }, ...cats.map((c) => ({ slug: c.slug, name: c.name, name_en: c.name_en }))], [cats, t]);

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v === "all" || v === "new") p.delete(k); else p.set(k, v);
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
          <div className="flex items-center gap-1 min-w-0 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
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

          <div className="flex items-center gap-2 md:gap-3 shrink-0 text-[11px] tracking-luxe uppercase self-end md:self-auto">
            <span className="hidden md:inline text-muted-foreground">{t("catalog.sort")}:</span>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-0 underline underline-offset-4 decoration-foreground/30"
            >
              <option value="new">{t("catalog.sortNew")}</option>
              <option value="price_asc">{t("catalog.sortPriceAsc")}</option>
              <option value="price_desc">{t("catalog.sortPriceDesc")}</option>
            </select>
          </div>
        </div>
      </div>

      <section className="py-16 md:py-20">
        <div className="container">
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground italic font-display text-2xl py-24">{t("catalog.empty")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
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
