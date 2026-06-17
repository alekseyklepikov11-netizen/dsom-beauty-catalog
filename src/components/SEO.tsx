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
  "Сыворотки и крем с указанными концентрациями: Vitamin C 2000 ppm, Ретинол 0,3%, PDRN 0,1%. Без маркетинговых уловок. Старт продаж на Ozon — июль 2026.";

// schema.org JSON-LD для брендовой карточки.
// Юр.лицо (legalName/taxID/street address) НЕ публикуем по бренд-регламенту —
// эти данные доступны только в /oferta и /privacy. Для поисковиков сохраняем
// бренд-уровень: имя, домен, логотип, контакты, соц.сети, страна.
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DSOM",
  url: "https://dsom.ru",
  logo: "https://dsom.ru/og-default.jpg",
  address: {
    "@type": "PostalAddress",
    addressCountry: "RU",
  },
  contactPoint: [
    { "@type": "ContactPoint", contactType: "customer support", email: "hello@dsom.ru" },
    { "@type": "ContactPoint", contactType: "sales", email: "b2b@dsom.ru" },
  ],
  sameAs: ["https://t.me/dsom_official"],
};

const SEO = ({ title, description, image, type = "website", jsonLd, canonical }: Props) => {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Активная косметика с прозрачным составом`;
  const desc = description || DEFAULT_DESCRIPTION;
  const url = canonical || (typeof window !== "undefined" ? window.location.href : "");
  const ogImageRaw = image || "/og-default.jpg";
  // og:image должен быть абсолютным URL, иначе соцсети/парсеры его не подхватывают
  const ogImage = ogImageRaw.startsWith("http") ? ogImageRaw : `https://dsom.ru${ogImageRaw}`;
  const ldArr = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const allLd = [ORGANIZATION_JSONLD, ...ldArr];

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

      {allLd.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
