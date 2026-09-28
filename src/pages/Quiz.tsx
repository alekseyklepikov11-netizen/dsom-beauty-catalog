import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isIncompatiblePair, loadStaticCatalog, selectProductsBySlugs } from "@/lib/staticCatalog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductLite } from "@/components/ProductCard";
import QuickViewDialog from "@/components/QuickViewDialog";
import PromoGate from "@/components/PromoGate";
import SEO from "@/components/SEO";

// Slugs реальных продуктов DSOM (сверено с /data/catalog.json 28.09.2026).
// Ответы квиза дают баллы продуктам; рекомендуются 2-3 лучших.
// ⚠️ GLOW и RENEW несовместимы в одной рутине — вместе в результат не попадают (см. isIncompatiblePair).
const SLUGS = {
  GLOW: "vitamin-c-microspicules-serum",           // P1 GLOW — витамин C + микроспикулы (сияние, ровный тон; вечером)
  RENEW: "retinol-palmitate-microneedles-serum",   // P2 RENEW — ретинол (обновление, гладкость)
  LIFT: "pdrn-aloe-lifting-serum",                 // P3 LIFT — PDRN (упругость, восстановление)
  HYDRO: "lamellar-cream-hyaluronic",              // P4 HYDRO — ламеллярный крем (увлажнение, барьер)
};

type Slug = typeof SLUGS[keyof typeof SLUGS];

interface Option {
  value: string;
  label: { ru: string; en: string };
  // Score delta per product slug (-2..+3)
  scores: Partial<Record<Slug, number>>;
}

interface QuizQuestion {
  id: string;
  q: { ru: string; en: string };
  options: Option[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "concern",
    q: {
      ru: "Что больше всего беспокоит в коже?",
      en: "What concerns you most about your skin?",
    },
    options: [
      {
        value: "wrinkles",
        label: { ru: "Морщины, признаки возраста", en: "Wrinkles, signs of aging" },
        scores: { [SLUGS.LIFT]: 3, [SLUGS.RENEW]: 2, [SLUGS.HYDRO]: 1 },
      },
      {
        value: "dullness",
        label: { ru: "Тусклость, нет сияния", en: "Dullness, lack of radiance" },
        scores: { [SLUGS.GLOW]: 3, [SLUGS.HYDRO]: 1 },
      },
      {
        value: "dryness",
        label: { ru: "Сухость, обезвоженность", en: "Dryness, dehydration" },
        scores: { [SLUGS.HYDRO]: 3, [SLUGS.LIFT]: 2 },
      },
      {
        value: "texture",
        label: { ru: "Неровный тон, текстура", en: "Uneven tone, texture" },
        scores: { [SLUGS.RENEW]: 3, [SLUGS.GLOW]: 2, [SLUGS.HYDRO]: 1 },
      },
    ],
  },
  {
    id: "skin_type",
    q: {
      ru: "Какой у вас тип кожи?",
      en: "What's your skin type?",
    },
    options: [
      {
        value: "normal",
        label: { ru: "Нормальная", en: "Normal" },
        scores: {},
      },
      {
        value: "dry",
        label: { ru: "Сухая", en: "Dry" },
        scores: { [SLUGS.HYDRO]: 2, [SLUGS.LIFT]: 1, [SLUGS.RENEW]: -1, [SLUGS.GLOW]: -2 },
      },
      {
        value: "oily",
        label: { ru: "Жирная", en: "Oily" },
        scores: { [SLUGS.RENEW]: 1, [SLUGS.GLOW]: 1 },
      },
      {
        value: "combo",
        label: { ru: "Комбинированная", en: "Combination" },
        scores: { [SLUGS.RENEW]: 1, [SLUGS.GLOW]: 1, [SLUGS.HYDRO]: 1 },
      },
      {
        value: "sensitive",
        label: { ru: "Чувствительная", en: "Sensitive" },
        scores: { [SLUGS.LIFT]: 2, [SLUGS.HYDRO]: 2, [SLUGS.RENEW]: -2, [SLUGS.GLOW]: -2 },
      },
    ],
  },
  {
    id: "retinol_experience",
    q: {
      ru: "Какой у вас опыт с ретинолом?",
      en: "Your experience with retinol?",
    },
    options: [
      {
        value: "regular",
        label: { ru: "Использую регулярно", en: "Use it regularly" },
        scores: { [SLUGS.RENEW]: 2 },
      },
      {
        value: "tried_irritation",
        label: { ru: "Пробовала — раздражает кожу", en: "Tried it — caused irritation" },
        scores: { [SLUGS.RENEW]: -2, [SLUGS.LIFT]: 2, [SLUGS.HYDRO]: 1 },
      },
      {
        value: "never",
        label: { ru: "Никогда не использовала", en: "Never used it" },
        scores: { [SLUGS.LIFT]: 1, [SLUGS.HYDRO]: 1 },
      },
      {
        value: "want_to_try",
        label: { ru: "Хочу попробовать", en: "Want to try" },
        scores: { [SLUGS.RENEW]: 2 },
      },
    ],
  },
  {
    id: "time",
    q: {
      ru: "Когда вам удобно наносить уход?",
      en: "When do you prefer to apply skincare?",
    },
    options: [
      {
        value: "morning",
        label: { ru: "Только утром", en: "Only in the morning" },
        scores: { [SLUGS.HYDRO]: 2, [SLUGS.LIFT]: 1, [SLUGS.RENEW]: -1, [SLUGS.GLOW]: -2 },
      },
      {
        value: "evening",
        label: { ru: "Только вечером", en: "Only in the evening" },
        scores: { [SLUGS.RENEW]: 2, [SLUGS.GLOW]: 2, [SLUGS.LIFT]: 1, [SLUGS.HYDRO]: 1 },
      },
      {
        value: "both",
        label: { ru: "Утром и вечером", en: "Morning and evening" },
        scores: { [SLUGS.HYDRO]: 2, [SLUGS.RENEW]: 1, [SLUGS.LIFT]: 1 },
      },
      {
        value: "courses",
        label: { ru: "Курсами, когда есть время", en: "In courses, when I have time" },
        scores: { [SLUGS.LIFT]: 2 },
      },
    ],
  },
  {
    id: "goal",
    q: {
      ru: "Какой результат хотите получить?",
      en: "What result are you looking for?",
    },
    options: [
      {
        value: "lifting",
        label: { ru: "Лифтинг и упругость", en: "Lifting and firmness" },
        scores: { [SLUGS.LIFT]: 3, [SLUGS.RENEW]: 1 },
      },
      {
        value: "renewal",
        label: { ru: "Обновление, гладкость", en: "Renewal, smoothness" },
        scores: { [SLUGS.RENEW]: 3 },
      },
      {
        value: "hydration",
        label: { ru: "Глубокое увлажнение", en: "Deep hydration" },
        scores: { [SLUGS.HYDRO]: 3, [SLUGS.LIFT]: 1 },
      },
      {
        value: "comfort",
        label: { ru: "Восстановление и комфорт", en: "Recovery and comfort" },
        scores: { [SLUGS.LIFT]: 2, [SLUGS.HYDRO]: 2 },
      },
    ],
  },
];

/** Убирает из списка второй продукт стоп-пары (GLOW↔RENEW), сохраняя порядок. */
function dropIncompatible<T extends { slug: string }>(list: T[]): T[] {
  const out: T[] = [];
  for (const p of list) {
    if (!out.some((q) => isIncompatiblePair(q.slug, p.slug))) out.push(p);
  }
  return out;
}

const Quiz = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language as "ru" | "en";
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<ProductLite[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];

  // Compute scores per product slug from all answers.
  const recommendedSlugs = useMemo<Slug[]>(() => {
    const scores: Record<string, number> = {
      [SLUGS.GLOW]: 0,
      [SLUGS.RENEW]: 0,
      [SLUGS.LIFT]: 0,
      [SLUGS.HYDRO]: 0,
    };
    for (const q of QUESTIONS) {
      const ans = answers[q.id];
      if (!ans) continue;
      const opt = q.options.find((o) => o.value === ans);
      if (!opt) continue;
      for (const [slug, delta] of Object.entries(opt.scores)) {
        scores[slug] = (scores[slug] || 0) + (delta as number);
      }
    }
    // GLOW и RENEW несовместимы — в результат попадает только один.
    // Главная забота «тусклость/сияние» — это задача GLOW: тогда остаётся GLOW, даже если RENEW набрал больше
    // за счёт следующих ответов (опыт с ретинолом, «обновление»). В остальных случаях — продукт с бОльшим баллом.
    if (isIncompatiblePair(SLUGS.GLOW, SLUGS.RENEW) && scores[SLUGS.GLOW] > 0 && scores[SLUGS.RENEW] > 0) {
      const glowWins =
        answers.concern === "dullness" || scores[SLUGS.GLOW] > scores[SLUGS.RENEW];
      if (glowWins) scores[SLUGS.RENEW] = -10;
      else scores[SLUGS.GLOW] = -10;
    }
    // Sort slugs by score desc, keep those with positive score, take top 3
    const sorted = Object.entries(scores)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slug]) => slug as Slug);
    // Always include Hydro as a finisher if recommending 1-2 actives and Hydro isn't there
    if (sorted.length > 0 && !sorted.includes(SLUGS.HYDRO)) {
      sorted.push(SLUGS.HYDRO);
    }
    return sorted;
  }, [answers]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const slugs = recommendedSlugs;

      // Сначала статический JSON, при его отсутствии — прежний supabase-путь
      const cat = await loadStaticCatalog();
      if (cat) {
        let fromJson = selectProductsBySlugs(cat, slugs) as ProductLite[];
        // Fallback внутри JSON: если slug'и не совпали (продукты переименованы) — первые 4
        if (fromJson.length === 0) fromJson = cat.products.slice(0, 4) as ProductLite[];
        fromJson = dropIncompatible(fromJson);
        setResults(fromJson);
        return;
      }

      let products: ProductLite[] = [];
      if (slugs.length > 0) {
        const { data } = await supabase
          .from("products")
          .select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new")
          .in("slug", slugs)
          .eq("is_visible", true);
        const found = (data || []) as ProductLite[];
        // Preserve order from recommendedSlugs
        products = slugs
          .map((s) => found.find((p) => p.slug === s))
          .filter((p): p is ProductLite => Boolean(p));
      }
      // Fallback: if nothing matched (e.g. products renamed), show bestsellers
      if (products.length === 0) {
        const { data } = await supabase
          .from("products")
          .select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new")
          .eq("is_visible", true)
          .limit(4);
        products = (data || []) as ProductLite[];
      }
      setResults(dropIncompatible(products));
    } finally {
      setLoading(false);
    }
  };

  const select = (value: string) => {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    if (step < total - 1) {
      setStep(step + 1);
    }
    // Результат после последнего ответа запускает useEffect ниже — уже с актуальными answers.
    // (Раньше здесь был setTimeout(fetchResults) со «старым» замыканием: считал баллы без последнего ответа.)
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setResults(null);
  };

  useEffect(() => {
    if (Object.keys(answers).length === total && results === null && !loading) {
      fetchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={lang === "en" ? "Find your DSOM routine — Quiz" : "Подбор ритуала — квиз DSOM"}
        description={lang === "en"
          ? "Take a 1-minute quiz to pick 2-3 DSOM serums and cream tailored to your skin and goals."
          : "Пройдите минутный квиз — подберём 2-3 продукта DSOM под ваш тип кожи и цель."}
      />
      <Header />

      <section className="container py-16 md:py-24">
        {!results ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[11px] tracking-luxe uppercase text-accent mb-4">
                — {lang === "en" ? "Skincare quiz" : "Подбор ритуала"}
              </p>
              <h1 className="font-display text-5xl md:text-6xl leading-[0.98]">
                {lang === "en" ? "Find your" : "Подберём"}
                <br />
                <span className="italic">{lang === "en" ? "DSOM ritual" : "ваш ритуал"}</span>
              </h1>
              <p className="mt-6 text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {lang === "en"
                  ? "5 quick questions about your skin, your concerns and your routine. We'll recommend 2-3 products from the DSOM line."
                  : "5 коротких вопросов о вашей коже, целях и привычках. Подберём 2-3 продукта из линейки DSOM."}
              </p>
            </div>

            <div className="flex items-center gap-1.5 mb-10">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 transition-colors ${
                    i <= step ? "bg-foreground" : "bg-border"
                  }`}
                />
              ))}
            </div>

            <p className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-4">
              {lang === "en" ? `Step ${step + 1} of ${total}` : `Шаг ${step + 1} из ${total}`}
            </p>
            <h2 className="font-display text-3xl md:text-4xl mb-10 leading-tight">
              {current.q[lang]}
            </h2>

            <div className="grid sm:grid-cols-2 gap-3">
              {current.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => select(opt.value)}
                  className="group bg-secondary/40 hover:bg-foreground hover:text-background border border-border hover:border-foreground rounded-xl p-6 text-left transition-all"
                >
                  <p className="font-display text-2xl group-hover:translate-x-1 transition-transform">
                    {opt.label[lang]}
                  </p>
                </button>
              ))}
            </div>

            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="mt-8 text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                ← {lang === "en" ? "Back" : "Назад"}
              </button>
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-32">
            <Sparkles className="w-8 h-8 mx-auto animate-pulse text-accent" />
            <p className="text-[11px] tracking-luxe uppercase text-muted-foreground mt-4">
              {lang === "en" ? "Crafting your selection…" : "Подбираем ритуал…"}
            </p>
          </div>
        ) : (
          <div>
            <div className="text-center mb-12">
              <p className="text-[11px] tracking-luxe uppercase text-accent mb-4">
                — {lang === "en" ? "Your DSOM ritual" : "Ваш ритуал DSOM"}
              </p>
              <h1 className="font-display text-5xl md:text-6xl leading-[0.98]">
                {lang === "en" ? "Curated for" : "Подобрано"}
                <br />
                <span className="italic">{lang === "en" ? "your skin" : "под вашу кожу"}</span>
              </h1>
              <p className="mt-6 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {lang === "en"
                  ? "These products work together. After launch, you'll be able to buy them on Ozon — get a promocode by subscribing to our channel."
                  : "Эти продукты работают вместе. После запуска вы сможете купить их на Ozon — получите промокод, подписавшись на канал."}
              </p>
              <button
                onClick={restart}
                className="mt-8 inline-flex items-center gap-2 text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                {lang === "en" ? "Retake quiz" : "Пройти заново"}
              </button>
            </div>

            {results.length === 0 ? (
              <p className="text-center text-muted-foreground italic font-display text-2xl py-16">
                {lang === "en"
                  ? "We couldn't find a match. Browse our full catalog."
                  : "Подходящего совпадения не нашлось. Посмотрите весь каталог."}
              </p>
            ) : (
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-16 max-w-6xl mx-auto">
                {results.map((p, i) => (
                  <div
                    key={p.id}
                    className={`w-full sm:w-[calc(50%-16px)] ${results.length === 4 ? "lg:w-[calc(25%-24px)]" : "lg:w-[calc(33.333%-22px)]"}`}
                  >
                    <ProductCard product={p} index={i} onQuickView={setQuickSlug} />
                  </div>
                ))}
              </div>
            )}

            {/* Промокод под результатом — экран выше обещает его */}
            <div className="max-w-md mx-auto mt-16">
              <PromoGate variant="card" source="quiz" />
            </div>

            <div className="text-center mt-16">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 text-[11px] tracking-luxe uppercase border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors"
              >
                {lang === "en" ? "See full catalog" : "Весь каталог"}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </section>

      <Footer />
      <QuickViewDialog slug={quickSlug} onClose={() => setQuickSlug(null)} />
    </main>
  );
};

export default Quiz;
