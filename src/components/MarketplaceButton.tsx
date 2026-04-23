import { ArrowUpRight } from "lucide-react";

const LABELS: Record<string, string> = {
  wildberries: "Wildberries",
  ozon: "Ozon",
  yandex_market: "Яндекс Маркет",
  goldapple: "Золотое Яблоко",
  other: "Купить",
};

const COLORS: Record<string, string> = {
  wildberries: "bg-[hsl(320_70%_50%)] text-white hover:bg-[hsl(320_70%_45%)]",
  ozon: "bg-[hsl(220_85%_55%)] text-white hover:bg-[hsl(220_85%_50%)]",
  yandex_market: "bg-[hsl(50_95%_55%)] text-foreground hover:bg-[hsl(50_95%_50%)]",
  goldapple: "bg-foreground text-background hover:bg-accent",
  other: "bg-foreground text-background hover:bg-accent",
};

const MarketplaceButton = ({ kind, url, label }: { kind: string; url: string; label?: string | null }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className={`group flex items-center justify-between gap-4 rounded-full pl-6 pr-2 py-2 text-[11px] tracking-luxe uppercase transition-all duration-300 ${COLORS[kind] || COLORS.other}`}
    >
      <span>{label || LABELS[kind] || kind}</span>
      <span className="grid place-items-center w-9 h-9 rounded-full bg-white/15 group-hover:bg-white/25 transition-colors">
        <ArrowUpRight className="w-4 h-4" />
      </span>
    </a>
  );
};

export default MarketplaceButton;
