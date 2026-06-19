// Кнопка «В корзину». Используется в ProductCard, ProductPage, QuickViewDialog.
// Визуально следует языку маркетплейс-кнопок (rounded-full, tracking-luxe).
//
// Аналитика (ревью): НЕ редактируем сгенерированный types.ts ради нового enum-значения
// (правка затрётся при регенерации). cart_add/checkout_start/order_create вводятся
// ОТДЕЛЬНОЙ миграцией analytics_event_type ДО включения трекинга. Пока — без track().
import { useTranslation } from "react-i18next";
import { ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import type { ProductLite } from "@/components/ProductCard";

interface Props {
  product: Pick<
    ProductLite,
    "id" | "slug" | "name" | "name_en" | "price" | "cover_image_url" | "volume"
  >;
  variant?: "compact" | "full";
  className?: string;
}

const AddToCartButton = ({ product, variant = "full", className = "" }: Props) => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const { add, has } = useCart();
  const inCart = has(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      nameEn: product.name_en,
      price: Number(product.price),
      image: product.cover_image_url,
      volume: product.volume,
    });
    toast.success(lang === "en" ? "Added to cart" : "Добавлено в корзину");
  };

  const label = inCart
    ? lang === "en" ? "In cart — add more" : "В корзине — ещё"
    : lang === "en" ? "Add to cart" : "В корзину";

  if (variant === "compact") {
    return (
      <button
        onClick={handleAdd}
        aria-label={label}
        className={`grid place-items-center w-9 h-9 rounded-full bg-foreground text-background hover:bg-accent transition-colors ${className}`}
      >
        {inCart ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={`group flex items-center justify-center gap-3 w-full rounded-full bg-foreground text-background px-6 py-3.5 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors ${className}`}
    >
      {inCart ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
      {label}
    </button>
  );
};

export default AddToCartButton;
