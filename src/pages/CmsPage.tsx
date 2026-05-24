import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import NotFound from "./NotFound";
import { track } from "@/lib/analytics";

interface Page {
  slug: string;
  title: string;
  title_en: string | null;
  content: any;
  content_en: any;
}

interface Banner {
  id: string;
  title: string; title_en: string | null;
  subtitle: string | null; subtitle_en: string | null;
  cta_label: string | null; cta_label_en: string | null;
  cta_url: string | null;
  image_url: string | null; video_url: string | null;
  ab_group: string | null;
}

// Map CMS page slug → banner position
const SLUG_TO_BANNER_POSITION: Record<string, string> = {
  about: "about_top",
  catalog: "catalog_top",
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
                  <span className="flex-1">{l.replace(/^[—–-]\s+/, "")}</span>
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
              <p className="text-foreground/85 leading-relaxed">{intro}</p>
              <ul className="space-y-2 text-foreground/85">
                {items.map((l, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-accent select-none">—</span>
                    <span className="flex-1">{l.replace(/^[—–-]\s+/, "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        return (
          <p key={idx} className="text-foreground/85 leading-relaxed text-[15px] md:text-base">
            {block}
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
  const [banner, setBanner] = useState<Banner | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setBanner(null);
    setPage(null);
    setNotFound(false);

    const bannerPosition = SLUG_TO_BANNER_POSITION[slug];

    (async () => {
      const pagePromise = supabase
        .from("pages")
        .select("slug,title,title_en,content,content_en")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      const bannerPromise = bannerPosition
        ? supabase
            .from("banners")
            .select("id,title,title_en,subtitle,subtitle_en,cta_label,cta_label_en,cta_url,image_url,video_url,ab_group")
            .eq("position", bannerPosition)
            .eq("is_active", true)
            .order("sort_order")
        : Promise.resolve({ data: [] as Banner[] });

      const [pageRes, bannerRes] = await Promise.all([pagePromise, bannerPromise]);

      if (!pageRes.data) setNotFound(true);
      else setPage(pageRes.data as Page);

      const banners = ((bannerRes as any).data || []) as Banner[];
      if (banners.length > 0) {
        const chosen = banners[Math.floor(Math.random() * banners.length)];
        setBanner(chosen);
        track("banner_view", { banner_id: chosen.id, value: chosen.ab_group || "default" });
      }

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

  const bannerTitle = banner ? (lang === "en" && banner.title_en ? banner.title_en : banner.title) : null;
  const bannerSubtitle = banner ? (lang === "en" && banner.subtitle_en ? banner.subtitle_en : banner.subtitle) : null;
  const bannerCta = banner ? (lang === "en" && banner.cta_label_en ? banner.cta_label_en : banner.cta_label) : null;

  return (
    <main className="min-h-screen bg-background">
      <SEO title={seoTitle || title} description={seoDescription} />
      <Header />

      {banner && (banner.image_url || banner.video_url) && (
        <section className="relative h-[60vh] min-h-[420px] flex items-end overflow-hidden bg-[#0a0a0a]">
          {banner.video_url ? (
            <video
              autoPlay muted loop playsInline preload="auto"
              poster={banner.image_url || undefined}
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={banner.video_url} type="video/mp4" />
            </video>
          ) : (
            <img
              src={banner.image_url!}
              alt={bannerTitle || title}
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60 pointer-events-none" />

          <div className="relative container pb-12 md:pb-20 text-white animate-fade-up">
            {bannerTitle && (
              <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-3xl">
                {bannerTitle}
              </h1>
            )}
            {bannerSubtitle && (
              <p className="mt-5 max-w-xl font-barlow text-[15px] md:text-[17px] text-white/85 leading-relaxed">
                {bannerSubtitle}
              </p>
            )}
            {bannerCta && banner.cta_url && (
              <Link
                to={banner.cta_url}
                onClick={() => track("banner_click", { banner_id: banner.id, value: banner.ab_group || "default" })}
                className="mt-7 inline-flex items-center gap-2 bg-white text-[#111] rounded-full px-6 py-3 font-barlow font-medium text-[14px] hover:bg-white/90 transition-colors"
              >
                {bannerCta}
              </Link>
            )}
          </div>
        </section>
      )}

      <article className="container max-w-3xl py-20 md:py-28">
        {loading ? (
          <p className="text-center text-muted-foreground tracking-luxe uppercase text-xs py-24">…</p>
        ) : (
          <>
            {!banner && (
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

      <Footer />
    </main>
  );
};

export default CmsPage;
