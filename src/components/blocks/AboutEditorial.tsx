import { Link } from "react-router-dom";
import { ArrowUpRight, ScanSearch, FlaskConical, Coins } from "lucide-react";

// Редакционная вёрстка страницы «О бренде» — первый блок системы «DSOM Editorial Lab».
// Принципы: воздух вместо плашек, крупная типографика, тонкий honey-акцент, один
// продуктовый визуал, микромоушн ТОЛЬКО на CSS-hover (без JS-reveal — чтобы не
// прятать текст от ботов/пререндера). Концентрации НЕ выпячиваем — нарратив о подходе.
// Копия сохранена с сайта; из лида убрано «российский» в лоб (правило бренда).

type Lang = "ru" | "en";

const COPY = {
  ru: {
    manifesto: "Сначала состав. Потом всё остальное.",
    lede:
      "DSOM — бренд активной косметики. Расшифровывается как Derma Science Of Modernity. Не слоган — направление мысли: про настоящую науку, а не красивые слова на упаковке.",
    s1eyebrow: "Откуда мы появились",
    s1: [
      "Бренд родился из вопроса покупателя — почему я плачу четыре с половиной тысячи за сыворотку, и нигде не написано, какая в ней концентрация работающего активного компонента. Просто «комплекс премиум-витаминов». А что внутри этого комплекса — узнать невозможно, пока не попробуешь и не сравнишь с тем, что было раньше.",
      "Из этого вопроса появилась простая мысль: создавать косметику с точным ответом на каждое «зачем». Какой актив. В какой форме. На каком основании мы его выбрали.",
    ],
    s2eyebrow: "Как мы работаем",
    s2: [
      "Мы устанавливаем требования к каждой формуле и выбираем те, которые им соответствуют. Производим в России. Каждый продукт сертифицирован. Реквизиты ответственного юр.лица и регистрационные документы — в публичной оферте на /page/oferta. Мы несём ответственность за каждый продукт.",
      "Цена до 1990 ₽ — не потому что «эконом». Потому что нам не нужно покрывать телевизионный бюджет, флагманский салон в центре Москвы и премиум-наценку за восприятие. Нам нужно покрывать хорошее сырьё и честную формулу.",
    ],
    principlesEyebrow: "Во что это складывается",
    principles: [
      { icon: ScanSearch, t: "Точный ответ на каждое «зачем»", d: "Какой актив, в какой форме и на каком основании выбран." },
      { icon: FlaskConical, t: "Сила — в комплексе, не в цифрах", d: "Активы работают системой, а не громкими процентами на упаковке." },
      { icon: Coins, t: "Цена — за сырьё и формулу", d: "Не за телебюджет, салон в центре и наценку за восприятие." },
    ],
    s3eyebrow: "Линейка",
    s3:
      "Мы начали с четырёх продуктов — утреннего, вечернего, курсового и увлажняющего. Это базовый ритуал, который закрывает большинство задач. Линейка развивается: очищение, защита, специализированные форматы — по тем же стандартам. Новый продукт появляется, когда формула готова. Не раньше.",
    cta: "Смотреть линейку",
    craft: "Производим в России · по нашим спецификациям",
  },
  en: {
    manifesto: "Ingredients first. Everything else follows.",
    lede:
      "DSOM is an active skincare brand. It stands for Derma Science Of Modernity. Not a slogan — a way of thinking: real science, not pretty words on the box.",
    s1eyebrow: "Where we came from",
    s1: [
      "The brand grew from a customer's question — why do I pay a small fortune for a serum, and nowhere does it say the concentration of the active that actually works? Just a «premium vitamin complex». What's inside that complex you can't know until you try it and compare.",
      "From that question came a simple idea: make skincare with a precise answer to every «why». Which active. In which form. On what grounds we chose it.",
    ],
    s2eyebrow: "How we work",
    s2: [
      "We set requirements for every formula and pick the ones that meet them. Made in Russia. Every product is certified. The responsible legal entity and registration documents are in the public offer at /page/oferta. We stand behind every product.",
      "A price up to 1990 ₽ — not because it's «budget». Because we don't need to cover a TV budget, a flagship salon in central Moscow, and a premium markup for perception. We need to cover good raw materials and an honest formula.",
    ],
    principlesEyebrow: "What it adds up to",
    principles: [
      { icon: ScanSearch, t: "A precise answer to every «why»", d: "Which active, in which form, and why it was chosen." },
      { icon: FlaskConical, t: "Strength is in the complex, not the numbers", d: "Actives work as a system, not as loud percentages on the box." },
      { icon: Coins, t: "Price is for raw materials and formula", d: "Not for a TV budget, a downtown salon or a perception markup." },
    ],
    s3eyebrow: "The line",
    s3:
      "We started with four products — morning, evening, a course treatment and a moisturiser. A base ritual that covers most needs. The line grows — cleansing, protection, specialised formats — to the same standards. A new product appears when the formula is ready. Not before.",
    cta: "See the line",
    craft: "Made in Russia · to our specifications",
  },
} as const;

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] tracking-luxe uppercase text-accent mb-5">— {children}</p>
);

const AboutEditorial = ({ lang = "ru" }: { lang?: Lang }) => {
  const c = COPY[lang];
  return (
    <div className="pb-24">
      {/* Манифест — крупная типографическая врезка */}
      <section className="container max-w-4xl pt-20 md:pt-28 pb-16 md:pb-24">
        <h2 className="font-display text-4xl md:text-6xl leading-[1.05] text-foreground max-w-3xl">
          {c.manifesto}
        </h2>
        <div className="mt-8 h-px w-24 bg-accent/50" />
        <p className="mt-8 text-lg md:text-xl leading-relaxed text-foreground/80 max-w-2xl">{c.lede}</p>
      </section>

      {/* Откуда мы появились */}
      <section className="container max-w-4xl py-12 md:py-16 border-t border-border/60">
        <Eyebrow>{c.s1eyebrow}</Eyebrow>
        <div className="space-y-6 max-w-2xl">
          {c.s1.map((p, i) => (
            <p key={i} className="text-foreground/85 leading-relaxed text-[15px] md:text-base">{p}</p>
          ))}
        </div>
      </section>

      {/* Как мы работаем — split: текст + продуктовый визуал (sticky на desktop) */}
      <section className="container py-12 md:py-20 border-t border-border/60">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          <div className="max-w-xl">
            <Eyebrow>{c.s2eyebrow}</Eyebrow>
            <div className="space-y-6">
              {c.s2.map((p, i) => (
                <p key={i} className="text-foreground/85 leading-relaxed text-[15px] md:text-base">{p}</p>
              ))}
            </div>
          </div>
          <div className="md:sticky md:top-28">
            <div className="group relative overflow-hidden rounded-sm bg-secondary/40 border border-border/60">
              <img
                src="https://new.dsom.ru/storage/v1/object/public/product-images/p3-lift-frosted.webp"
                alt={lang === "en" ? "DSOM serum — crafted to our specifications" : "Сыворотка DSOM — по нашим спецификациям"}
                loading="lazy"
                className="w-full h-auto object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>
            <p className="mt-3 text-[11px] tracking-luxe uppercase text-muted-foreground/80">{c.craft}</p>
          </div>
        </div>
      </section>

      {/* Принципы — честные сигналы (без «российское» первым) */}
      <section className="container max-w-5xl py-12 md:py-16 border-t border-border/60">
        <Eyebrow>{c.principlesEyebrow}</Eyebrow>
        <div className="grid sm:grid-cols-3 gap-8 md:gap-10">
          {c.principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="group">
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-foreground/15 text-accent mb-4 transition-transform duration-300 ease-out group-hover:-rotate-12 group-hover:border-accent/60">
                  <Icon className="w-5 h-5" strokeWidth={1.6} />
                </span>
                <h3 className="font-display text-xl md:text-2xl mb-2 leading-snug">{p.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Линейка + переход в каталог */}
      <section className="container max-w-4xl py-12 md:py-16 border-t border-border/60">
        <Eyebrow>{c.s3eyebrow}</Eyebrow>
        <p className="text-foreground/85 leading-relaxed text-[15px] md:text-base max-w-2xl">{c.s3}</p>
        <Link
          to="/catalog"
          className="group inline-flex items-center gap-2.5 mt-8 border border-foreground/40 rounded-full pl-6 pr-2 py-2 text-[11px] tracking-luxe uppercase text-foreground hover:bg-foreground hover:text-background transition-colors duration-200"
        >
          {c.cta}
          <span className="grid place-items-center w-8 h-8 rounded-full bg-foreground/5 group-hover:bg-background/20 transition-colors">
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
          </span>
        </Link>
      </section>
    </div>
  );
};

export default AboutEditorial;
