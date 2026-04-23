import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import NotFound from "./NotFound";

interface Page {
  slug: string;
  title: string;
  title_en: string | null;
  content: any;
  content_en: any;
}

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
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from("pages")
      .select("slug,title,title_en,content,content_en")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else setPage(data as Page);
        setLoading(false);
      });
  }, [slug]);

  if (notFound) return <NotFound />;

  const title = page ? (lang === "en" && page.title_en ? page.title_en : page.title) : "";
  const bodySrc = page ? (lang === "en" && page.content_en ? page.content_en : page.content) : null;
  const body = renderBody(bodySrc);

  return (
    <main className="min-h-screen bg-background">
      <SEO title={title} description={body.slice(0, 160)} />
      <Header />

      <article className="container max-w-3xl py-20 md:py-28">
        {loading ? (
          <p className="text-center text-muted-foreground tracking-luxe uppercase text-xs py-24">…</p>
        ) : (
          <>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-12">{title}</h1>
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
