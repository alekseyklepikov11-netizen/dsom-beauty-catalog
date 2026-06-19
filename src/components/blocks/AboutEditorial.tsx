import { Link } from "react-router-dom";
import { ArrowUpRight, ScanSearch, FlaskConical, Coins } from "lucide-react";

// Страница «О бренде» — тёмный графитовый «разворот» (PANTONE 4140C = цвет упаковки DSOM).
// Намеренно выбивается из светлого сайта: страница-манифест в фирменном цвете коробки.
// Слоган = hero (вместо баннера «Архитектура линейки»). Концентрации НЕ выпячиваем.
// Микромоушн только CSS-hover. Текст копии — реальный с сайта.

type Lang = "ru" | "en";

const GRAPHITE = "#393D47";
const CUTOUT = "https://new.dsom.ru/storage/v1/object/public/product-images/p3-lift-cutout.webp";

const COPY = {
  ru: {
    eyebrow: "О бренде",
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
    craft: "Произведено в России · по нашим спецификациям",
  },
  en: {
    eyebrow: "About",
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
  <p className="text-[11px] tracking-luxe uppercase text-[#C8922A] mb-5">— {children}</p>
);

const AboutEditorial = ({ lang = "ru" }: { lang?: Lang }) => {
  const c = COPY[lang];
  return (
    <div className="text-[#F5EFE6] pb-24" style={{ backgroundColor: GRAPHITE }}>
      {/* HERO — слоган-манифест на графите (вместо баннера «Архитектура линейки») */}
      <section className="container max-w-5xl pt-24 md:pt-36 pb-16 md:pb-24">
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <h1 className="font-display text-5xl md:text-8xl leading-[1.0] text-[#F5EFE6] max-w-4xl">
          {c.manifesto}
        </h1>
        <div className="mt-9 h-px w-24 bg-[#C8922A]/70" />
        <p className="mt-8 text-lg md:text-2xl leading-relaxed text-[#F5EFE6]/75 max-w-2xl font-display">{c.lede}</p>
      </section>

      {/* Откуда мы появились */}
      <section className="container max-w-4xl py-12 md:py-16 border-t border-[#F5EFE6]/12">
        <Eyebrow>{c.s1eyebrow}</Eyebrow>
        <div className="space-y-6 max-w-2xl">
          {c.s1.map((p, i) => (
            <p key={i} className="text-[#F5EFE6]/80 leading-relaxed text-[15px] md:text-base">{p}</p>
          ))}
        </div>
      </section>

      {/* Как мы работаем — split: текст + флакон-вырезка на графите с подсветкой */}
      <section className="container py-12 md:py-20 border-t border-[#F5EFE6]/12">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="max-w-xl">
            <Eyebrow>{c.s2eyebrow}</Eyebrow>
            <div className="space-y-6">
              {c.s2.map((p, i) => (
                <p key={i} className="text-[#F5EFE6]/80 leading-relaxed text-[15px] md:text-base">{p}</p>
              ))}
            </div>
          </div>
          <div className="relative group flex justify-center md:justify-end">
            {/* мягкое honey-свечение за флаконом */}
            <div
              className="pointer-events-none absolute inset-0 m-auto rounded-full blur-3xl opacity-40"
              style={{ background: "radial-gradient(closest-side, rgba(200,146,42,0.45), transparent)", width: "70%", height: "70%" }}
            />
            <img
              src={CUTOUT}
              alt={lang === "en" ? "DSOM serum — crafted to our specifications" : "Сыворотка DSOM — по нашим спецификациям"}
              loading="lazy"
              className="relative w-auto object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              style={{ maxHeight: "560px", filter: "drop-shadow(0 28px 55px rgba(0,0,0,0.55))" }}
            />
          </div>
        </div>
        <p className="mt-6 text-[11px] tracking-luxe uppercase text-[#F5EFE6]/45 text-center md:text-right">{c.craft}</p>
      </section>

      {/* Принципы */}
      <section className="container max-w-5xl py-12 md:py-16 border-t border-[#F5EFE6]/12">
        <Eyebrow>{c.principlesEyebrow}</Eyebrow>
        <div className="grid sm:grid-cols-3 gap-8 md:gap-10">
          {c.principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="group">
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#F5EFE6]/20 text-[#C8922A] mb-4 transition-transform duration-300 ease-out group-hover:-rotate-12 group-hover:border-[#C8922A]/70">
                  <Icon className="w-5 h-5" strokeWidth={1.6} />
                </span>
                <h3 className="font-display text-xl md:text-2xl mb-2 leading-snug text-[#F5EFE6]">{p.t}</h3>
                <p className="text-sm text-[#F5EFE6]/55 leading-relaxed">{p.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Линейка + переход в каталог */}
      <section className="container max-w-4xl py-12 md:py-16 border-t border-[#F5EFE6]/12">
        <Eyebrow>{c.s3eyebrow}</Eyebrow>
        <p className="text-[#F5EFE6]/80 leading-relaxed text-[15px] md:text-base max-w-2xl">{c.s3}</p>
        <Link
          to="/catalog"
          className="group inline-flex items-center gap-2.5 mt-8 border border-[#F5EFE6]/40 rounded-full pl-6 pr-2 py-2 text-[11px] tracking-luxe uppercase text-[#F5EFE6] hover:bg-[#F5EFE6] hover:text-[#393D47] transition-colors duration-200"
        >
          {c.cta}
          <span className="grid place-items-center w-8 h-8 rounded-full bg-[#F5EFE6]/10 group-hover:bg-[#393D47]/20 transition-colors">
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
          </span>
        </Link>
      </section>
    </div>
  );
};

export default AboutEditorial;
