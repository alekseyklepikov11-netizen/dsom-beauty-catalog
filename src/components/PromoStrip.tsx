import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Promo {
  id: string;
  code: string;
  description: string | null;
  description_en: string | null;
  discount_type: "percent" | "amount";
  discount_value: number;
  expires_at: string | null;
  marketplace_url: string | null;
}

const PromoStrip = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [promos, setPromos] = useState<Promo[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("promo_codes")
      .select("id,code,description,description_en,discount_type,discount_value,expires_at,marketplace_url")
      .eq("is_active", true)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setPromos((data || []) as Promo[]));
  }, []);

  if (promos.length === 0) return null;

  const copy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success(lang === "en" ? "Code copied" : "Код скопирован");
    setTimeout(() => setCopied(null), 1800);
  };

  const formatDiscount = (p: Promo) =>
    p.discount_type === "percent"
      ? `−${Math.round(p.discount_value)}%`
      : `−${Number(p.discount_value).toLocaleString(lang === "en" ? "en-US" : "ru-RU")} ₽`;

  return (
    <section className="py-20 bg-foreground text-background">
      <div className="container">
        <div className="text-center mb-10">
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-4">— {lang === "en" ? "Special offers" : "Промокоды"}</p>
          <h2 className="font-display text-4xl md:text-5xl">
            {lang === "en" ? "Save with our codes" : "Скидки и подарки"}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {promos.map((p) => {
            const desc = lang === "en" && p.description_en ? p.description_en : p.description;
            return (
              <div key={p.id} className="border border-background/15 p-6 flex flex-col gap-4 bg-background/[0.03] hover:bg-background/[0.06] transition-colors">
                <div className="flex items-start justify-between">
                  <Tag className="w-4 h-4 text-accent" />
                  <span className="font-display text-3xl">{formatDiscount(p)}</span>
                </div>
                {desc && <p className="text-sm text-background/70 leading-relaxed">{desc}</p>}
                <div className="mt-auto flex items-stretch gap-0 border border-background/30">
                  <code className="flex-1 px-4 py-2.5 font-mono text-sm tracking-wider text-background bg-background/5 select-all">
                    {p.code}
                  </code>
                  <button
                    onClick={() => copy(p.code)}
                    aria-label="Copy code"
                    className="px-3 grid place-items-center bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                  >
                    {copied === p.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {p.marketplace_url && (
                  <a
                    href={p.marketplace_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[10px] tracking-luxe uppercase text-accent hover:underline -mt-2"
                  >
                    {lang === "en" ? "Apply on store →" : "Применить в магазине →"}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PromoStrip;
