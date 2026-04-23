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
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          {product.cover_image_url && (
            <img
              src={product.cover_image_url}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            />
          )}
        </Link>

        {(product.is_bestseller || product.is_new) && (
          <span className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 text-[10px] tracking-luxe uppercase">
            {product.is_new ? t("product.new") : t("product.bestseller")}
          </span>
        )}

        <button
          onClick={handleFav}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          className={`absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-full backdrop-blur-md transition-all ${
            fav ? "bg-accent text-accent-foreground" : "bg-background/80 text-foreground hover:bg-background"
          }`}
        >
          <Heart className={`w-4 h-4 ${fav ? "fill-current" : ""}`} />
        </button>

        {onQuickView && (
          <button
            onClick={(e) => { e.preventDefault(); onQuickView(product.slug); }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 inline-flex items-center gap-2 bg-background text-foreground rounded-full pl-4 pr-4 py-2 text-[10px] tracking-luxe uppercase shadow-soft hover:bg-foreground hover:text-background"
          >
            <Eye className="w-3.5 h-3.5" />
            {t("catalog.quickView")}
          </button>
        )}
      </div>
      <Link to={`/product/${product.slug}`} className="block">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl leading-tight">{name}</h3>
            {subtitle && <p className="text-sm text-muted-foreground mt-1 italic font-display">{subtitle}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-xl">{Number(product.price).toLocaleString(lang === "en" ? "en-US" : "ru-RU")} ₽</p>
            {product.volume && <p className="text-[11px] text-muted-foreground mt-1">{product.volume}</p>}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
