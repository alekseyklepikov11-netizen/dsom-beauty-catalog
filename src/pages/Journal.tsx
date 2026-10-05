import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { loadStaticCatalog, selectPagesBySlugs } from "@/lib/staticCatalog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";

// Список статей журнала. Новые статьи добавлять сюда (плюс саму страницу /page/<slug>).
const ARTICLE_SLUGS = ["niacinamid-dlya-chego-nuzhen", "gialuronovaya-kislota-nizko-i-vysokomolekulyarnaya", "chuvstvitelnaya-kozha-kak-vybirat-uhod", "poryadok-naneseniya-uhoda-layering", "retinol-retinal-bakuchiol-raznica", "kak-vosstanovit-barer-kozhi","kakaya-syvorotka-nuzhna-po-zadache", "kak-chitat-sostav-kosmetiki-inci", "rossiyskie-analogi-koreyskih-syvorotok", "pdrn", "retinol", "vitamin-c", "lamellar", "microneedles", "retinol-i-vitamin-c"];

interface ArticleLite {
  slug: string;
  title: string;
  title_en: string | null;
  content: any;
}

const Journal = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [items, setItems] = useState<ArticleLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Сначала статический JSON (порядок ARTICLE_SLUGS сохраняет селектор)
      const cat = await loadStaticCatalog();
      if (cat) {
        setItems(selectPagesBySlugs(cat, ARTICLE_SLUGS) as ArticleLite[]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("pages")
        .select("slug,title,title_en,content")
        .in("slug", ARTICLE_SLUGS)
        .eq("is_published", true);
      // Сохраняем порядок ARTICLE_SLUGS
      const order = (s: string) => ARTICLE_SLUGS.indexOf(s);
      const list = ((data || []) as ArticleLite[]).sort((a, b) => order(a.slug) - order(b.slug));
      setItems(list);
      setLoading(false);
    })();
  }, []);

  const excerpt = (c: any): string => {
    if (c && typeof c === "object") {
      if (c.seo_description) return String(c.seo_description);
      if (c.body) return String(c.body).replace(/\n+/g, " ").slice(0, 165);
    }
    return "";
  };

  const heading = lang === "en" ? "Journal" : "Журнал";
  const desc =
    lang === "en"
      ? "DSOM journal: PDRN, retinol, vitamin C, lamellar cream and how active skincare actually works."
      : "Журнал DSOM: PDRN, ретинол, витамин С, ламеллярный крем и как работает активная косметика — простым языком, без обещаний.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: heading + " — DSOM",
    description: desc,
    url: "https://dsom.ru/journal",
    hasPart: items.map((a) => ({
      "@type": "Article",
      headline: lang === "en" && a.title_en ? a.title_en : a.title,
      url: "https://dsom.ru/page/" + a.slug,
    })),
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO title={heading} description={desc} canonical="https://dsom.ru/journal" jsonLd={jsonLd} />
      <Header />
      <section className="container max-w-3xl py-20 md:py-28">
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-6">{heading}</h1>
        <p className="text-foreground/70 mb-14 text-lg leading-relaxed">{desc}</p>
        {loading ? (
          // Скелетон по сетке списка (столько же карточек, сколько статей): футер не «прыгает» (CLS).
          <div className="space-y-10" role="status" aria-busy="true" aria-label={lang === "en" ? "Loading" : "Загрузка"}>
            {ARTICLE_SLUGS.map((s) => (
              <div key={s} className="border-t border-foreground/10 pt-8">
                <Skeleton className="h-8 md:h-9 w-3/4 mb-3 rounded-sm" />
                <Skeleton className="h-4 w-full mb-2 rounded-sm" />
                <Skeleton className="h-4 w-2/3 rounded-sm" />
                <Skeleton className="h-3 w-16 mt-5 rounded-sm" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="italic text-muted-foreground">—</p>
        ) : (
          <div className="space-y-10">
            {items.map((a) => (
              <Link
                key={a.slug}
                to={`/page/${a.slug}`}
                className="block group border-t border-foreground/10 pt-8"
              >
                <h2 className="font-display text-2xl md:text-3xl mb-3 group-hover:text-accent transition-colors">
                  {lang === "en" && a.title_en ? a.title_en : a.title}
                </h2>
                <p className="text-foreground/70 leading-relaxed">{excerpt(a.content)}</p>
                <span className="inline-block mt-4 text-[11px] tracking-luxe uppercase text-accent">
                  {lang === "en" ? "Read" : "Читать"} →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default Journal;
