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

  const bannerTitle = banner ? (lang === "en" && banner.title_en ? banner.title_en : banner.title) : null;
  const bannerSubtitle = banner ? (lang === "en" && banner.subtitle_en ? banner.subtitle_en : banner.subtitle) : null;
  const bannerCta = banner ? (lang === "en" && banner.cta_label_en ? banner.cta_label_en : banner.cta_label) : null;

  return (
    <main className="min-h-screen bg-background">
      <SEO title={title} description={body.slice(0, 160)} />
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
            <div className="prose prose-lg max-w-none text-foreground/90 leading-relaxed whitespace-pre-line font-light">
              {body || <p className="italic text-muted-foreground">—</p>}
            </div>
          </>
        )}
      </article>

      <Footer />
    </main>
  );
};

export default CmsPage;
