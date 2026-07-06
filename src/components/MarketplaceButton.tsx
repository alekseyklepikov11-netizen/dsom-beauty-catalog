import { ArrowUpRight } from "lucide-react";
import { track } from "@/lib/analytics";

const LABELS: Record<string, string> = {
  wildberries: "Wildberries",
  ozon: "Ozon",
  yandex_market: "Яндекс Маркет",
  goldapple: "Золотое Яблоко",
  other: "Купить",
};

/* Канон DSOM: кнопки маркетплейсов — монохром бренда, цвет площадки — только точкой-маркером.
   Цветные заливки площадок убраны 06.07.2026 (читались как чужой брендинг на нашей странице). */
const DOT_COLORS: Record<string, string> = {
  wildberries: "bg-[hsl(320_70%_50%)]",
  ozon: "bg-[hsl(220_85%_55%)]",
  yandex_market: "bg-[hsl(50_95%_55%)]",
  goldapple: "bg-[hsl(0_0%_100%)]",
  other: "bg-accent",
};

interface Props {
  kind: string;
  url: string;
  label?: string | null;
  productId?: string;
}

const MarketplaceButton = ({ kind, url, label, productId }: Props) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      onClick={() => track("marketplace_click", { product_id: productId, value: kind, meta: { url } })}
      className="group flex items-center justify-between gap-4 rounded-full pl-6 pr-2 py-2 text-[11px] tracking-luxe uppercase transition-all duration-300 bg-foreground text-background hover:bg-accent active:scale-[0.98]"
    >
      <span className="inline-flex items-center gap-2.5">
        <span aria-hidden className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[kind] || DOT_COLORS.other}`} />
        {label || LABELS[kind] || kind}
      </span>
      <span className="grid place-items-center w-9 h-9 rounded-full bg-white/15 group-hover:bg-white/25 transition-colors">
        <ArrowUpRight className="w-4 h-4" />
      </span>
    </a>
  );
};

export default MarketplaceButton;
