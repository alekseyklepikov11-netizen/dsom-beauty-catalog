import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { loadStaticCatalog, searchProducts, selectBrandById } from "@/lib/staticCatalog";
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

      // Сначала статический JSON, при его отсутствии — прежний supabase-путь
      const cat = await loadStaticCatalog();
      if (cat) {
        const found = searchProducts(cat, q, 8);
        if (cancelled) return;
        setResults(
          found.map((d) => {
            const brand = selectBrandById(cat, d.brand_id);
            return {
              id: d.id,
              slug: d.slug,
              name: d.name,
              name_en: d.name_en,
              cover_image_url: d.cover_image_url,
              price: d.price,
              brand: brand ? (lang === "en" && brand.name_en ? brand.name_en : brand.name) : null,
            };
          })
        );
        setLoading(false);
        track("search_query", { value: q, meta: { results: found.length } });
        return;
      }

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

  // Окно открывается без Radix-Trigger, поэтому возврат фокуса делаем сами:
  // запоминаем элемент, с которого открыли, и возвращаем на него (или на кнопку в шапке).
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onOpenAutoFocus = () => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
  };
  const onCloseAutoFocus = (e: Event) => {
    e.preventDefault();
    const prev = returnFocusRef.current;
    const target =
      prev && prev.isConnected && prev !== document.body
        ? prev
        : (document.querySelector("header button[data-search-trigger]") as HTMLElement | null);
    target?.focus();
  };

  // Esc, ловушка фокуса, aria-modal и возврат фокуса на кнопку поиска — от Radix Dialog.
  const goto = (slug: string) => {
    onClose();
    navigate(`/product/${slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPortal>
        <DialogOverlay className="z-[100] bg-foreground/40 backdrop-blur-sm" />
        <DialogPrimitive.Content
          aria-modal="true"
          onOpenAutoFocus={onOpenAutoFocus}
          onCloseAutoFocus={onCloseAutoFocus}
          aria-describedby={undefined}
          className="fixed inset-x-0 top-[10vh] z-[100] mx-auto w-[calc(100%-2rem)] max-w-2xl bg-background shadow-soft rounded-md overflow-hidden focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
        <DialogTitle className="sr-only">{t("a11y.searchDialog")}</DialogTitle>
        <div className="flex items-center gap-3 pl-5 pr-2 py-2 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            autoFocus
            type="search"
            enterKeyHint="search"
            aria-label={t("a11y.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === "en" ? "Search by name…" : "Искать по названию…"}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-base py-2 placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:hidden"
          />
          <DialogPrimitive.Close
            aria-label={t("a11y.closeSearch")}
            className="inline-flex items-center justify-center w-11 h-11 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </DialogPrimitive.Close>
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
                    type="button"
                    onClick={() => goto(r.slug)}
                    className="w-full flex items-center gap-4 px-5 py-3 hover:bg-secondary/60 text-left transition-colors"
                  >
                    <div className="w-12 h-14 bg-secondary shrink-0 overflow-hidden">
                      {r.cover_image_url && <img src={r.cover_image_url} alt={name} loading="lazy" decoding="async" className="w-full h-full object-cover" />}
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
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default SearchDialog;
