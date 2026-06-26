import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import NotFound from "./NotFound";
import { HeroBanner } from "@/components/HeroBanner";
import { useBanner, type BannerPosition } from "@/hooks/useBanner";
import AboutEditorial from "@/components/blocks/AboutEditorial";

interface Page {
  slug: string;
  title: string;
  title_en: string | null;
  content: any;
  content_en: any;
}

// Map CMS page slug → banner position (для CMS-страниц, у которых может быть hero-баннер)
const SLUG_TO_BANNER_POSITION: Record<string, BannerPosition> = {
  about: "about_top",
};

const renderBody = (body: any): string => {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (typeof body === "object" && typeof body.body === "string") return body.body;
  return "";
};

// Section heading: short ALL-CAPS line, no terminal punctuation, no ":" anywhere
// (двоеточие = пара "ключ: значение" → это не заголовок, а обычный пункт списка)
const isHeading = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 60) return false;
  if (/[.!?:;]/.test(trimmed)) return false; // отвергаем любые знаки препинания
  const letters = trimmed.match(/\p{L}/gu);
  if (!letters || letters.length < 2) return false;
  return letters.every((ch) => ch === ch.toUpperCase() && ch !== ch.toLowerCase());
};

const isEpigraph = (block: string) => /^[«"].+[»"]$/.test(block.trim()) && block.length < 400;

// Превращает внутренние пути /page/slug и /product/slug в кликабельные ссылки (внутренняя перелинковка для SEO)
const linkify = (text: string): (string | JSX.Element)[] => {
  const out: (string | JSX.Element)[] = [];
  const re = /(\/(?:page|product)\/[a-z0-9-]+)/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <a key={`${m.index}-${m[1]}`} href={m[1]} className="text-accent hover:underline">
        {m[1]}
      </a>
    );
    last = m.index + m[1].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

const FormattedBody = ({ text }: { text: string }) => {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-8">
      {blocks.map((block, idx) => {
        const lines = block.split("\n");
        const first = lines[0].trim();

        if (lines.length === 1 && isHeading(first)) {
          return (
            <h2
              key={idx}
              className="font-display text-2xl md:text-3xl tracking-luxe uppercase pt-8 mt-4 border-t border-foreground/10 text-foreground"
            >
              {first}
            </h2>
          );
        }

        if (idx === 0 && isEpigraph(block)) {
          return (
            <blockquote
              key={idx}
              className="font-display text-2xl md:text-3xl leading-snug text-foreground/90 border-l-2 border-accent pl-6 italic"
            >
              {block}
            </blockquote>
          );
        }

        if (lines.every((l) => /^[—–-]\s/.test(l.trim()))) {
          return (
            <ul key={idx} className="space-y-2 text-foreground/85">
              {lines.map((l, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-accent select-none">—</span>
                  <span className="flex-1">{linkify(l.replace(/^[—–-]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        const listStart = lines.findIndex((l) => /^[—–-]\s/.test(l.trim()));
        if (listStart > 0 && lines.slice(listStart).every((l) => /^[—–-]\s/.test(l.trim()) || !l.trim())) {
          const intro = lines.slice(0, listStart).join(" ").trim();
          const items = lines.slice(listStart).filter((l) => l.trim());
          return (
            <div key={idx} className="space-y-3">
              <p className="text-foreground/85 leading-relaxed">{linkify(intro)}</p>
              <ul className="space-y-2 text-foreground/85">
                {items.map((l, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-accent select-none">—</span>
                    <span className="flex-1">{linkify(l.replace(/^[—–-]\s+/, ""))}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        return (
          <p key={idx} className="text-foreground/85 leading-relaxed text-[15px] md:text-base">
            {linkify(block)}
          </p>
        );
      })}
    </div>
  );
};

const CmsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [page, setPage] = useState<Page | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  // Banner для CMS-страниц использует общий useBanner hook.
  // SLUG_TO_BANNER_POSITION позволяет привязать слаг к позиции в banners.
  // Если слаг не в карте — используем home_hero как fallback но всё равно НЕ рендерим
  // (т.к. ниже проверка `slug in SLUG_TO_BANNER_POSITION` решает показывать ли hero).
  const bannerPosition = SLUG_TO_BANNER_POSITION[slug || ""] || "home_hero";
  const bannerState = useBanner(bannerPosition);
  const showBannerHero = slug ? slug in SLUG_TO_BANNER_POSITION : false;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setPage(null);
    setNotFound(false);

    (async () => {
      const { data } = await supabase
        .from("pages")
        .select("slug,title,title_en,content,content_en")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (!data) setNotFound(true);
      else setPage(data as Page);

      setLoading(false);
    })();
  }, [slug]);

  if (notFound) return <NotFound />;

  const title = page ? (lang === "en" && page.title_en ? page.title_en : page.title) : "";
  const bodySrc = page ? (lang === "en" && page.content_en ? page.content_en : page.content) : null;
  const body = renderBody(bodySrc);

  // SEO-поля из content.seo_title / content.seo_description (см. БД pages)
  // Если не заполнены — fallback: title страницы + первые 160 символов body
  const seoTitle = (bodySrc && typeof bodySrc === "object" && bodySrc.seo_title) || undefined;
  const seoDescription = (bodySrc && typeof bodySrc === "object" && bodySrc.seo_description) || body.slice(0, 160);

  // Schema.org для статей: Article + BreadcrumbList (+ FAQPage, если в content.faq есть Q&A)
  const pageUrl = typeof window !== "undefined" ? window.location.href : `https://dsom.ru/page/${slug}`;
  const faq: { q: string; a: string }[] =
    bodySrc && typeof bodySrc === "object" && Array.isArray((bodySrc as any).faq) ? (bodySrc as any).faq : [];
  const cmsJsonLd: Record<string, any>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: seoDescription,
      inLanguage: lang === "en" ? "en" : "ru",
      mainEntityOfPage: pageUrl,
      author: { "@type": "Organization", name: "DSOM" },
      publisher: { "@type": "Organization", name: "DSOM", logo: { "@type": "ImageObject", url: "https://dsom.ru/og-default.jpg" } },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: lang === "en" ? "Home" : "Главная", item: "https://dsom.ru/" },
        { "@type": "ListItem", position: 2, name: title, item: pageUrl },
      ],
    },
  ];
  if (faq.length) {
    cmsJsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }

  return (
    <main className="min-h-screen bg-background">
      <SEO title={seoTitle || title} description={seoDescription} jsonLd={cmsJsonLd} />
      <Header />

      {showBannerHero && (
        <HeroBanner
          state={bannerState}
          variant="section"
          fallbackTitle={title}
          eyebrow={`— ${title}`}
          className="border-b border-border/60"
        />
      )}

      {slug === "about" ? (
        <AboutEditorial lang={lang === "en" ? "en" : "ru"} />
      ) : (
      <article className="container max-w-3xl py-20 md:py-28">
        {loading ? (
          <p className="text-center text-muted-foreground tracking-luxe uppercase text-xs py-24">…</p>
        ) : (
          <>
            {!showBannerHero && (
              <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-12">{title}</h1>
            )}
            {body ? (
              <FormattedBody text={body} />
            ) : (
              <p className="italic text-muted-foreground">—</p>
            )}

            {slug === "contacts" && (
              <div className="mt-16 pt-10 border-t border-foreground/10">
                <p className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-5">
                  {lang === "en" ? "On the map" : "На карте"}
                </p>
                <div className="relative w-full overflow-hidden rounded-sm border border-foreground/10 bg-muted">
                  <iframe
                    title={lang === "en" ? "DSOM office on map" : "Офис DSOM на карте"}
                    src="https://yandex.ru/map-widget/v1/?ll=37.598%2C55.778&z=16&pt=37.598,55.778,pm2rdm&l=map"
                    width="100%"
                    height="420"
                    frameBorder={0}
                    loading="lazy"
                    className="block w-full"
                  />
                </div>
                <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                  {lang === "en"
                    ? "7 Krasnoproletarskaya street, room 1n, Tverskoy district, Moscow, 127006."
                    : "г. Москва, ул. Краснопролетарская, д. 7, помещение 1н, Тверской район, 127006."}
                </p>
              </div>
            )}
          </>
        )}
      </article>
      )}

      <Footer />
    </main>
  );
};

export default CmsPage;
