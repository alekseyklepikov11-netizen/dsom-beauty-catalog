import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductLite } from "@/components/ProductCard";
import QuickViewDialog from "@/components/QuickViewDialog";
import SEO from "@/components/SEO";

interface QuizQuestion {
  id: string;
  q: { ru: string; en: string };
  options: { value: string; label: { ru: string; en: string }; tags: string[] }[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "skin_type",
    q: { ru: "Какой у вас тип кожи?", en: "What's your skin type?" },
    options: [
      { value: "dry", label: { ru: "Сухая", en: "Dry" }, tags: ["dry", "moisturizing", "увлажнение"] },
      { value: "oily", label: { ru: "Жирная", en: "Oily" }, tags: ["oily", "mattifying", "матирование"] },
      { value: "combo", label: { ru: "Комбинированная", en: "Combination" }, tags: ["combo", "balance", "баланс"] },
      { value: "sensitive", label: { ru: "Чувствительная", en: "Sensitive" }, tags: ["sensitive", "soothing", "успокаивающее"] },
    ],
  },
  {
    id: "concern",
    q: { ru: "Главная проблема, которую хотите решить?", en: "Main concern you want to address?" },
    options: [
      { value: "aging", label: { ru: "Признаки возраста", en: "Signs of aging" }, tags: ["anti-aging", "retinol", "ретинол", "антивозрастное"] },
      { value: "acne", label: { ru: "Высыпания", en: "Acne" }, tags: ["acne", "acid", "кислоты", "акне"] },
      { value: "dullness", label: { ru: "Тусклый цвет лица", en: "Dullness" }, tags: ["brightening", "vitamin c", "витамин с", "сияние"] },
      { value: "dehydration", label: { ru: "Обезвоженность", en: "Dehydration" }, tags: ["hydration", "hyaluronic", "гиалурон", "увлажнение"] },
    ],
  },
  {
    id: "step",
    q: { ru: "Какой шаг ухода ищете?", en: "Which skincare step are you looking for?" },
    options: [
      { value: "cleanse", label: { ru: "Очищение", en: "Cleansing" }, tags: ["cleanser", "очищение", "cleanse"] },
      { value: "tone", label: { ru: "Тонизация", en: "Toning" }, tags: ["tonic", "toner", "тоник"] },
      { value: "serum", label: { ru: "Сыворотка", en: "Serum" }, tags: ["serum", "сыворотка"] },
      { value: "moisturize", label: { ru: "Увлажнение / крем", en: "Moisturizer" }, tags: ["cream", "крем", "moisturizer"] },
    ],
  },
  {
    id: "texture",
    q: { ru: "Какую текстуру предпочитаете?", en: "Preferred texture?" },
    options: [
      { value: "light", label: { ru: "Лёгкая, водянистая", en: "Light, watery" }, tags: ["light", "лёгкий", "water"] },
      { value: "rich", label: { ru: "Плотная, питательная", en: "Rich, nourishing" }, tags: ["rich", "питательный", "nourishing"] },
      { value: "gel", label: { ru: "Гель", en: "Gel" }, tags: ["gel", "гель"] },
      { value: "any", label: { ru: "Не важно", en: "Doesn't matter" }, tags: [] },
    ],
  },
];

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

  const selectedTags = useMemo(() => {
    const tags: string[] = [];
    QUESTIONS.forEach((q) => {
      const v = answers[q.id];
      if (!v) return;
      const opt = q.options.find((o) => o.value === v);
      if (opt) tags.push(...opt.tags);
    });
    return tags;
  }, [answers]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // Fetch products with at least one matching tag, fallback to bestsellers
      let products: ProductLite[] = [];
      if (selectedTags.length > 0) {
        const { data } = await supabase
          .from("products")
          .select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new,tags")
          .eq("is_visible", true)
          .overlaps("tags", selectedTags)
          .limit(20);
        products = ((data || []) as any[]).map((p) => p as ProductLite);
        // Score by number of matching tags
        const scored = ((data || []) as any[]).map((p) => {
          const matches = (p.tags || []).filter((t: string) =>
            selectedTags.some((st) => st.toLowerCase() === t.toLowerCase())
          ).length;
          return { p, matches };
        });
        scored.sort((a, b) => b.matches - a.matches);
        products = scored.slice(0, 6).map((s) => s.p as ProductLite);
      }
      if (products.length < 3) {
        const { data } = await supabase
          .from("products")
          .select("id,slug,name,name_en,subtitle,subtitle_en,price,volume,cover_image_url,is_bestseller,is_new")
          .eq("is_visible", true)
          .eq("is_bestseller", true)
          .limit(6);
        const ids = new Set(products.map((p) => p.id));
        for (const p of (data || []) as ProductLite[]) {
          if (!ids.has(p.id) && products.length < 6) products.push(p);
        }
      }
      setResults(products);
    } finally {
      setLoading(false);
    }
  };

  const select = (value: string) => {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      // Last question — fetch
      setTimeout(() => fetchResults(), 100);
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setResults(null);
  };

  // Trigger fetch when entering results
  useEffect(() => {
    if (Object.keys(answers).length === total && results === null && !loading) {
      fetchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={lang === "en" ? "Find your perfect skincare — DSOM Quiz" : "Подбор ухода — квиз DSOM"}
        description={lang === "en"
          ? "Take a 1-minute quiz to discover skincare products tailored to your skin type and concerns."
          : "Пройдите минутный квиз и получите персональную подборку ухода под ваш тип кожи."}
      />
      <Header />

      <section className="container py-16 md:py-24">
        {!results ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[11px] tracking-luxe uppercase text-accent mb-4">
                — {lang === "en" ? "Skincare quiz" : "Подбор ухода"}
              </p>
              <h1 className="font-display text-5xl md:text-6xl leading-[0.98]">
                {lang === "en" ? "Find your" : "Найдите свой"}
                <br />
                <span className="italic">{lang === "en" ? "perfect routine" : "идеальный ритуал"}</span>
              </h1>
            </div>

            {/* Progress */}
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
              {lang === "en" ? "Crafting your selection…" : "Подбираем для вас…"}
            </p>
          </div>
        ) : (
          <div>
            <div className="text-center mb-12">
              <p className="text-[11px] tracking-luxe uppercase text-accent mb-4">
                — {lang === "en" ? "Your selection" : "Ваша подборка"}
              </p>
              <h1 className="font-display text-5xl md:text-6xl leading-[0.98]">
                {lang === "en" ? "Curated for" : "Подобрано"}
                <br />
                <span className="italic">{lang === "en" ? "your skin" : "для вашей кожи"}</span>
              </h1>
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
                  ? "We couldn't find a perfect match. Browse our full catalog."
                  : "Точного совпадения не нашлось. Посмотрите весь каталог."}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 max-w-6xl mx-auto">
                {results.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} onQuickView={setQuickSlug} />
                ))}
              </div>
            )}

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
