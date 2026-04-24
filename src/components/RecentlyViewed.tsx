import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import ProductCard, { ProductLite } from "@/components/ProductCard";
import { getRecentlyViewed } from "@/lib/recentlyViewed";

interface Props {
  excludeId?: string;
  onQuickView?: (slug: string) => void;
}

const RecentlyViewed = ({ excludeId, onQuickView }: Props) => {
  const { i18n } = useTranslation();
  const [items, setItems] = useState<ProductLite[]>([]);

  useEffect(() => {
    (async () => {
      const ids = getRecentlyViewed(excludeId).slice(0, 4);
      if (ids.length === 0) {
        setItems([]);
        return;
      }
      const { data } = await supabase
        .from("products")
        .select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new")
        .in("id", ids)
        .eq("is_visible", true);
      // preserve order from localStorage
      const map = new Map((data || []).map((p) => [p.id, p as ProductLite]));
      setItems(ids.map((id) => map.get(id)).filter(Boolean) as ProductLite[]);
    })();
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="container py-16 border-t border-border">
      <h2 className="font-display text-3xl md:text-4xl mb-8">
        {i18n.language === "en" ? "Recently viewed" : "Недавно просмотренные"}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} onQuickView={onQuickView} />
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
