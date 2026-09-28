import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { isIncompatiblePair, loadStaticCatalog, selectRelatedProducts } from "@/lib/staticCatalog";
import ProductCard, { ProductLite } from "./ProductCard";

interface Props {
  productId: string;
  /** slug текущего товара — для стоп-пар несовместимости в fallback-пути. */
  productSlug?: string;
  categoryId: string | null;
  brandId: string | null;
  onQuickView?: (slug: string) => void;
}

const RelatedProducts = ({ productId, productSlug, categoryId, brandId, onQuickView }: Props) => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [items, setItems] = useState<ProductLite[]>([]);

  useEffect(() => {
    (async () => {
      // Сначала статический JSON, при его отсутствии — прежний supabase-путь
      const cat = await loadStaticCatalog();
      if (cat) {
        setItems(selectRelatedProducts(cat, { productId, brandId, categoryId }, 4) as ProductLite[]);
        return;
      }

      // Fallback на Supabase: те же правила, что и в selectRelatedProducts
      // (бренд → категория → остальные; стоп-пара GLOW↔RENEW не рекомендуется).
      const { data } = await supabase
        .from("products")
        .select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new,brand_id,category_id")
        .eq("is_visible", true)
        .neq("id", productId)
        .order("sort_order")
        .limit(12);
      type Row = ProductLite & { brand_id: string | null; category_id: string | null };
      const rank = (p: Row) =>
        (brandId && p.brand_id === brandId ? 0 : 2) + (categoryId && p.category_id === categoryId ? 0 : 1);
      const list = ((data || []) as Row[])
        .filter((p) => !(productSlug && isIncompatiblePair(productSlug, p.slug)))
        .map((p, i) => ({ p, i }))
        .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
        .slice(0, 4)
        .map((x) => x.p as ProductLite);

      setItems(list);
    })();
  }, [productId, productSlug, categoryId, brandId]);

  if (items.length === 0) return null;

  return (
    <section className="container py-20 border-t border-border">
      <div className="text-center mb-12">
        <p className="text-[11px] tracking-luxe uppercase text-accent mb-4">
          — {lang === "en" ? "You may also like" : "Вам может понравиться"}
        </p>
        <h2 className="font-display text-4xl md:text-5xl">
          {lang === "en" ? "Discover more" : "Откройте больше"}
        </h2>
      </div>
      {/* flex + justify-center: неполный ряд центрируется, одиночная карточка не прижата влево */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-12">
        {items.map((p, i) => (
          <div key={p.id} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
            <ProductCard product={p} index={i} onQuickView={onQuickView} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
