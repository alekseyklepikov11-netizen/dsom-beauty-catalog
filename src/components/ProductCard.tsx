import { useState } from "react";
import { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="group cursor-pointer animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden bg-secondary aspect-[4/5] mb-5">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={800}
          height={1000}
          className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />
        {product.tag && (
          <span className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 text-[10px] tracking-luxe uppercase text-foreground">
            {product.tag}
          </span>
        )}
        <div
          className={`absolute inset-x-0 bottom-0 bg-background/95 backdrop-blur-sm px-5 py-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            hovered ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {product.notes.map((n) => (
              <span key={n} className="text-[11px] tracking-wide text-muted-foreground">
                — {n}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-1.5">
            № {product.id} · {product.category}
          </p>
          <h3 className="font-display text-2xl leading-tight text-foreground">{product.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 italic font-display">
            {product.subtitle}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-xl text-foreground">{product.price.toLocaleString("ru-RU")} ₽</p>
          <p className="text-[11px] text-muted-foreground mt-1">{product.volume}</p>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
