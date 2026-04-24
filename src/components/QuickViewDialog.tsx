import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MarketplaceButton from "./MarketplaceButton";

interface QuickViewProps {
  slug: string | null;
  onClose: () => void;
}

interface ProductFull {
  id: string; slug: string; name: string; name_en: string | null;
  subtitle: string | null; subtitle_en: string | null;
  description: string | null; description_en: string | null;
  price: number; volume: string | null; cover_image_url: string | null;
}
interface MLink { id: string; kind: string; url: string; label: string | null }
interface Img { id: string; url: string }

const QuickViewDialog = ({ slug, onClose }: QuickViewProps) => {
  const { t, i18n } = useTranslation();
  const [product, setProduct] = useState<ProductFull | null>(null);
  const [links, setLinks] = useState<MLink[]>([]);
  const [images, setImages] = useState<Img[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) { setProduct(null); setLinks([]); setImages([]); setActiveIdx(0); return; }
    setLoading(true);
    setProduct(null);
    setLinks([]);
    setImages([]);
    setActiveIdx(0);
    (async () => {
      const { data: p } = await supabase
        .from("products")
        .select("id,slug,name,name_en,subtitle,subtitle_en,description,description_en,price,volume,cover_image_url")
        .eq("slug", slug).maybeSingle();
      if (p) {
        setProduct(p as ProductFull);
        const [linksRes, imgsRes] = await Promise.all([
          supabase.from("marketplace_links").select("id,kind,url,label").eq("product_id", p.id).eq("is_active", true),
          supabase.from("product_images").select("id,url").eq("product_id", p.id).order("sort_order"),
        ]);
        setLinks((linksRes.data || []) as MLink[]);
        setImages((imgsRes.data || []) as Img[]);
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (slug) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [slug, onClose]);

  if (!slug) return null;

  const lang = i18n.language;
  const name = product ? (lang === "en" && product.name_en ? product.name_en : product.name) : "";
  const subtitle = product ? (lang === "en" && product.subtitle_en ? product.subtitle_en : product.subtitle) : "";
  const description = product ? (lang === "en" && product.description_en ? product.description_en : product.description) : "";

  const gallery = product
    ? Array.from(new Set([product.cover_image_url, ...images.map((i) => i.url)].filter(Boolean) as string[]))
    : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6 animate-fade-up">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-3xl shadow-soft">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 grid place-items-center w-10 h-10 rounded-full bg-background/80 backdrop-blur hover:bg-secondary transition"
        >
          <X className="w-4 h-4" />
        </button>

        {loading || !product ? (
          <div className="p-20 text-center text-muted-foreground text-sm tracking-luxe uppercase">…</div>
        ) : (
          <div className="grid md:grid-cols-2">
            <div
              ref={galleryRef}
              className="relative bg-secondary aspect-square md:aspect-auto md:min-h-[560px] overflow-hidden snap-x snap-mandatory overflow-x-auto scroll-smooth flex"
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
                  <img src={g} alt={name} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              ))}
              {gallery.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
                  {gallery.map((_, i) => (
                    <span
                      key={`qv-dot-${i}`}
                      className={`h-1 rounded-full transition-all duration-300 ${activeIdx === i ? "w-6 bg-foreground" : "w-1.5 bg-foreground/40"}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="p-8 md:p-12 flex flex-col">
              <p className="text-[10px] tracking-luxe uppercase text-accent mb-4">{t("catalog.quickView")}</p>
              <h2 className="font-display text-4xl md:text-5xl leading-[1.05]">{name}</h2>
              {subtitle && <p className="font-display italic text-xl text-muted-foreground mt-2">{subtitle}</p>}

              <div className="flex items-end justify-between mt-6 pb-6 border-b border-border/60">
                <p className="font-display text-3xl">{Number(product.price).toLocaleString(lang === "en" ? "en-US" : "ru-RU")} ₽</p>
                {product.volume && <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">{product.volume}</p>}
              </div>

              {description && (
                <p className="text-sm leading-relaxed text-muted-foreground mt-6 line-clamp-5">{description}</p>
              )}

              <div className="mt-8">
                <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-3">{t("product.marketplaces")}</p>
                <div className="flex flex-col gap-2">
                  {links.length === 0 && <p className="text-xs text-muted-foreground italic">—</p>}
                  {links.map((l) => <MarketplaceButton key={l.id} kind={l.kind} url={l.url} label={l.label} />)}
                </div>
              </div>

              <Link
                to={`/product/${product.slug}`}
                onClick={onClose}
                className="mt-auto pt-8 inline-flex items-center gap-2 text-[11px] tracking-luxe uppercase border-b border-foreground self-start pb-1 hover:text-accent hover:border-accent transition-colors"
              >
                {t("product.openFull")} →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickViewDialog;
