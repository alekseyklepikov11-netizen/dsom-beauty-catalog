import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";

interface Result {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  cover_image_url: string | null;
  price: number;
  brand?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const SearchDialog = ({ open, onClose }: Props) => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const lang = i18n.language;

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id,slug,name,name_en,cover_image_url,price,brands(name,name_en)")
        .eq("is_visible", true)
        .or(`name.ilike.%${q}%,name_en.ilike.%${q}%,slug.ilike.%${q}%`)
        .limit(8);
      if (cancelled) return;
      setResults(
        ((data || []) as any[]).map((d) => ({
          id: d.id,
          slug: d.slug,
          name: d.name,
          name_en: d.name_en,
          cover_image_url: d.cover_image_url,
          price: d.price,
          brand: d.brands ? (lang === "en" && d.brands.name_en ? d.brands.name_en : d.brands.name) : null,
        }))
      );
      setLoading(false);
      // Track search query (debounced via the same setTimeout)
      track("search_query", { value: q, meta: { results: data?.length ?? 0 } });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, lang]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const goto = (slug: string) => {
    onClose();
    navigate(`/product/${slug}`);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="mx-auto max-w-2xl mt-[10vh] bg-background shadow-soft rounded-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === "en" ? "Search products, brands…" : "Искать товары, бренды…"}
            className="flex-1 bg-transparent border-0 outline-none text-base placeholder:text-muted-foreground/70"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              {lang === "en" ? "Type at least 2 characters" : "Введите минимум 2 символа"}
            </p>
          )}
          {query.trim().length >= 2 && !loading && results.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground italic font-display">
              {lang === "en" ? "Nothing found" : "Ничего не найдено"}
            </p>
          )}
          {loading && (
            <p className="px-5 py-10 text-center text-xs tracking-luxe uppercase text-muted-foreground">
              {lang === "en" ? "Searching…" : "Поиск…"}
            </p>
          )}
          <ul>
            {results.map((r) => {
              const name = lang === "en" && r.name_en ? r.name_en : r.name;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => goto(r.slug)}
                    className="w-full flex items-center gap-4 px-5 py-3 hover:bg-secondary/60 text-left transition-colors"
                  >
                    <div className="w-12 h-14 bg-secondary shrink-0 overflow-hidden">
                      {r.cover_image_url && <img src={r.cover_image_url} alt={name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {r.brand && <p className="text-[10px] tracking-luxe uppercase text-accent">{r.brand}</p>}
                      <p className="font-display text-lg leading-tight truncate">{name}</p>
                    </div>
                    <p className="font-display text-base shrink-0">
                      {Number(r.price).toLocaleString(lang === "en" ? "en-US" : "ru-RU")} ₽
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SearchDialog;
