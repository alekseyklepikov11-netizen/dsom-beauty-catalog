import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import ProductCard, { ProductLite } from "./ProductCard";

interface Props {
  productId: string;
  categoryId: string | null;
  brandId: string | null;
  onQuickView?: (slug: string) => void;
}

const RelatedProducts = ({ productId, categoryId, brandId, onQuickView }: Props) => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [items, setItems] = useState<ProductLite[]>([]);

  useEffect(() => {
    (async () => {
      // Try same brand first, then same category
      let q = supabase
        .from("products")
        .select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new")
        .eq("is_visible", true)
        .neq("id", productId)
        .limit(4);

      if (brandId) q = q.eq("brand_id", brandId);
      else if (categoryId) q = q.eq("category_id", categoryId);

      const { data } = await q;
      let list = (data || []) as ProductLite[];

      // Fallback: if too few, fetch by category
      if (list.length < 4 && categoryId) {
        const { data: more } = await supabase
          .from("products")
          .select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new")
          .eq("is_visible", true)
          .eq("category_id", categoryId)
          .neq("id", productId)
          .limit(4);
        const ids = new Set(list.map((p) => p.id));
        for (const p of (more || []) as ProductLite[]) {
          if (!ids.has(p.id) && list.length < 4) list.push(p);
        }
      }

      setItems(list);
    })();
  }, [productId, categoryId, brandId]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} onQuickView={onQuickView} />
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
