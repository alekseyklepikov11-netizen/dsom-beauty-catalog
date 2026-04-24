import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const ids = getRecentlyViewed(excludeId).slice(0, 8);
      if (ids.length === 0) {
        setItems([]);
        return;
      }
      const { data } = await supabase
        .from("products")
        .select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new")
        .in("id", ids)
        .eq("is_visible", true);
      const map = new Map((data || []).map((p) => [p.id, p as ProductLite]));
      setItems(ids.map((id) => map.get(id)).filter(Boolean) as ProductLite[]);
    })();
  }, [excludeId]);

  if (items.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="container py-20 md:py-28 border-t border-border">
      <div className="flex items-end justify-between mb-8 md:mb-10 gap-4">
        <div>
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">
            {i18n.language === "en" ? "— For you" : "— Для вас"}
          </p>
          <h2 className="font-display text-3xl md:text-5xl">
            {i18n.language === "en" ? "Recently viewed" : "Недавно просмотренные"}
          </h2>
        </div>
        {items.length > 1 && (
          <div className="hidden md:flex gap-2 shrink-0">
            <button
              onClick={() => scroll("left")}
              aria-label="Previous"
              className="grid place-items-center w-11 h-11 rounded-full border border-border hover:bg-foreground hover:text-background transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Next"
              className="grid place-items-center w-11 h-11 rounded-full border border-border hover:bg-foreground hover:text-background transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-5 md:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-4 px-4 md:mx-0 md:px-0 pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((p, i) => (
          <div
            key={p.id}
            className="snap-start shrink-0 w-[70%] sm:w-[45%] md:w-[32%] lg:w-[24%]"
          >
            <ProductCard product={p} index={i} onQuickView={onQuickView} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
