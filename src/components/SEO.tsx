import { Helmet } from "react-helmet-async";

interface Props {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, any> | Record<string, any>[];
  canonical?: string;
}

const SITE_NAME = "DSOM";
const DEFAULT_DESCRIPTION =
  "DSOM — кураторский магазин нишевой косметики. Уход за лицом и телом от мировых брендов. Доставка по России и за рубеж.";

const SEO = ({ title, description, image, type = "website", jsonLd, canonical }: Props) => {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Уход, рождённый наукой`;
  const desc = description || DEFAULT_DESCRIPTION;
  const url = canonical || (typeof window !== "undefined" ? window.location.href : "");
  const ogImage = image || "/og-default.jpg";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {url && <link rel="canonical" href={url} />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      {url && <meta property="og:url" content={url} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
