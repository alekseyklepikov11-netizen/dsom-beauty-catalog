import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductLite } from "@/components/ProductCard";
import QuickViewDialog from "@/components/QuickViewDialog";
import SEO from "@/components/SEO";

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const { ids, loading: favLoading } = useFavorites();
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favLoading || authLoading) return;
    (async () => {
      setLoading(true);
      if (ids.size === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("products")
        .select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new,product_images(url,sort_order)")
        .in("id", Array.from(ids))
        .eq("is_visible", true);
      const mapped = ((data || []) as any[]).map((p) => ({
        ...p,
        images: (p.product_images || [])
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((x: any) => x.url),
      })) as ProductLite[];
      setProducts(mapped);
      setLoading(false);
    })();
  }, [ids, favLoading, authLoading]);

  return (
    <main className="min-h-screen bg-background">
      <SEO title={lang === "en" ? "Favorites" : "Избранное"} description={lang === "en" ? "Your saved products on DSOM." : "Сохранённые товары на DSOM."} noindex />
      <Header />

      <section className="border-b border-border/60">
        <div className="container py-14 md:py-20">
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-4">— {lang === "en" ? "Wishlist" : "Избранное"}</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            {lang === "en" ? "Your saved" : "Ваши"} <span className="italic">{lang === "en" ? "rituals" : "ритуалы"}</span>
          </h1>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container">
          {!user && !authLoading ? (
            <div className="text-center py-24">
              <Heart className="w-10 h-10 mx-auto text-accent mb-6" strokeWidth={1.2} />
              <p className="font-display text-3xl mb-4">{lang === "en" ? "Sign in to save favorites" : "Войдите, чтобы сохранять избранное"}</p>
              <p className="text-muted-foreground mb-8">{lang === "en" ? "Your wishlist syncs across devices." : "Избранное синхронизируется между устройствами."}</p>
              <Link to="/auth" className="inline-block bg-foreground text-background px-8 py-3 text-[11px] tracking-luxe uppercase hover:bg-foreground/90 transition-colors">
                {lang === "en" ? "Sign in" : "Войти"}
              </Link>
            </div>
          ) : loading ? (
            <p className="text-center text-muted-foreground tracking-luxe uppercase text-xs py-24">…</p>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <Heart className="w-10 h-10 mx-auto text-muted-foreground mb-6" strokeWidth={1.2} />
              <p className="font-display text-3xl italic text-muted-foreground mb-6">
                {lang === "en" ? "Your wishlist is empty" : "Ваше избранное пусто"}
              </p>
              <Link to="/catalog" className="text-[11px] tracking-luxe uppercase border-b border-foreground pb-1">
                {lang === "en" ? "Explore catalog" : "Открыть каталог"} →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} onQuickView={setQuickSlug} />)}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <QuickViewDialog slug={quickSlug} onClose={() => setQuickSlug(null)} />
    </main>
  );
};

export default Favorites;
