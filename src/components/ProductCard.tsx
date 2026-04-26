import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, Heart } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";

export interface ProductLite {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  subtitle: string | null;
  subtitle_en: string | null;
  price: number;
  volume: string | null;
  cover_image_url: string | null;
  is_bestseller: boolean;
  is_new: boolean;
  /** Optional extra images (without cover). Cover is prepended automatically. */
  images?: string[];
}

interface Props {
  product: ProductLite;
  index: number;
  onQuickView?: (slug: string) => void;
}

const ProductCard = ({ product, index, onQuickView }: Props) => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;
  const { isFavorite, toggle, isAuthenticated } = useFavorites();
  const fav = isFavorite(product.id);
  const name = lang === "en" && product.name_en ? product.name_en : product.name;
  const subtitle = lang === "en" && product.subtitle_en ? product.subtitle_en : product.subtitle;

  const gallery = Array.from(
    new Set(
      [product.cover_image_url, ...(product.images || [])].filter(Boolean) as string[]
    )
  );
  const hasMultiple = gallery.length > 1;
  const [activeIdx, setActiveIdx] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info(lang === "en" ? "Sign in to save favorites" : "Войдите, чтобы сохранять избранное");
      navigate("/auth");
      return;
    }
    const added = await toggle(product.id);
    toast.success(
      added
        ? lang === "en" ? "Added to favorites" : "Добавлено в избранное"
        : lang === "en" ? "Removed from favorites" : "Убрано из избранного"
    );
  };

  return (
    <div className="group block animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="relative overflow-hidden bg-secondary aspect-[4/5] mb-5">
        {hasMultiple ? (
          <div
            ref={galleryRef}
            className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / el.clientWidth);
              if (idx !== activeIdx && idx >= 0 && idx < gallery.length) setActiveIdx(idx);
            }}
          >
            {gallery.map((g, i) => (
              <Link
                key={`${g}-${i}`}
                to={`/product/${product.slug}`}
                className="relative w-full h-full flex-shrink-0 snap-center snap-always block"
                style={{ minWidth: "100%" }}
              >
                <img
                  src={g}
                  alt={name}
                  loading={i === 0 ? "lazy" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />
              </Link>
            ))}
          </div>
        ) : (
          <Link to={`/product/${product.slug}`} className="block w-full h-full">
            {product.cover_image_url && (
              <img
                src={product.cover_image_url}
                alt={name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
            )}
          </Link>
        )}

        {(product.is_bestseller || product.is_new) && (
          <span className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm px-3 py-1 text-[10px] tracking-luxe uppercase">
            {product.is_new ? t("product.new") : t("product.bestseller")}
          </span>
        )}

        <button
          onClick={handleFav}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          className={`absolute top-3 right-3 z-10 grid place-items-center w-9 h-9 rounded-full backdrop-blur-md transition-all ${
            fav ? "bg-accent text-accent-foreground" : "bg-background/80 text-foreground hover:bg-background"
          }`}
        >
          <Heart className={`w-4 h-4 ${fav ? "fill-current" : ""}`} />
        </button>

        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 pointer-events-none">
            {gallery.map((_, i) => (
              <span
                key={`pc-dot-${i}`}
                className={`h-1 rounded-full transition-all duration-300 ${
                  activeIdx === i ? "w-5 bg-foreground" : "w-1.5 bg-foreground/40"
                }`}
              />
            ))}
          </div>
        )}

        {onQuickView && (
          <button
            onClick={(e) => { e.preventDefault(); onQuickView(product.slug); }}
            className={`absolute ${hasMultiple ? "bottom-7" : "bottom-4"} left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 inline-flex items-center gap-2 bg-background text-foreground rounded-full pl-4 pr-4 py-2 text-[10px] tracking-luxe uppercase shadow-soft hover:bg-foreground hover:text-background`}
          >
            <Eye className="w-3.5 h-3.5" />
            {t("catalog.quickView")}
          </button>
        )}
      </div>
      <Link to={`/product/${product.slug}`} className="block overflow-hidden">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg sm:text-2xl leading-tight break-words hyphens-auto">{name}</h3>
            {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-1 italic font-display break-words">{subtitle}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-base sm:text-xl whitespace-nowrap">{Number(product.price).toLocaleString(lang === "en" ? "en-US" : "ru-RU")} ₽</p>
            {product.volume && <p className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap">{product.volume}</p>}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
