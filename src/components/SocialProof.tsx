import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { shouldQueryTable } from "@/lib/staticCatalog";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  guest_name: string | null;
  created_at: string;
  product_id: string;
  product?: { slug: string; name: string; name_en: string | null } | null;
}

const SocialProof = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ count: number; avg: number }>({ count: 0, avg: 0 });

  useEffect(() => {
    (async () => {
      // Пока отзывов нет (маркер в catalog.json / флаг) — не шлём 2 запроса впустую,
      // компонент вернёт null (reviews пустой).
      if (!(await shouldQueryTable("reviews"))) return;

      const { data, count } = await supabase
        .from("reviews")
        .select("id,rating,title,body,guest_name,created_at,product_id,products(slug,name,name_en)", { count: "exact" })
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(3);

      const list = (data || []).map((r: any) => ({ ...r, product: r.products })) as Review[];
      setReviews(list);

      // For average, fetch all ratings (lightweight: just rating column)
      const { data: all } = await supabase.from("reviews").select("rating").eq("status", "approved");
      const ratings = (all || []).map((r: any) => r.rating as number);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      setStats({ count: count || ratings.length, avg });
    })();
  }, []);

  if (reviews.length === 0) return null;

  const heading = lang === "en" ? "Loved by our community" : "О нас говорят";
  const eyebrow = lang === "en" ? "— Real reviews" : "— Реальные отзывы";
  const allLabel = lang === "en" ? "Read all reviews" : "Все отзывы";
  const ofLabel = lang === "en" ? "based on" : "на основе";
  const reviewsLabel = lang === "en" ? "reviews" : "отзывов";

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-5">{eyebrow}</p>
          <h2 className="font-display text-5xl md:text-6xl">{heading}</h2>

          {stats.count > 0 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i <= Math.round(stats.avg) ? "fill-accent text-accent" : "text-muted-foreground/40"}`}
                  />
                ))}
              </div>
              <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">
                {stats.avg.toFixed(1)} · {ofLabel} {stats.count} {reviewsLabel}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {reviews.map((r) => {
            const productName = r.product
              ? lang === "en" && r.product.name_en
                ? r.product.name_en
                : r.product.name
              : "";
            return (
              <article
                key={r.id}
                className="relative bg-secondary/40 p-8 md:p-10 rounded-sm flex flex-col"
              >
                <Quote className="absolute top-6 right-6 w-6 h-6 text-accent/30" />
                <div className="flex items-center gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i <= r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                {r.title && <h3 className="font-display text-xl mb-3 leading-snug">{r.title}</h3>}
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-5 flex-1">
                  {r.body}
                </p>
                <div className="mt-6 pt-6 border-t border-border/60">
                  <p className="text-[11px] tracking-luxe uppercase text-foreground">
                    {r.guest_name || (lang === "en" ? "Verified buyer" : "Проверенный покупатель")}
                  </p>
                  {r.product && (
                    <Link
                      to={`/product/${r.product.slug}`}
                      className="text-[10px] tracking-luxe uppercase text-muted-foreground hover:text-accent transition-colors mt-1 inline-block"
                    >
                      {productName} →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/catalog"
            className="text-[11px] tracking-luxe uppercase border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors"
          >
            {allLabel} →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
