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
  "Сыворотки и крем с указанными концентрациями: Vitamin C 2000 ppm, Ретинол 0,3%, PDRN 0,1%. Без маркетинговых уловок. Старт продаж на Ozon — июнь 2026.";

const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DSOM",
  legalName: "ООО «ВАЛКЭНДВИР»",
  url: "https://dsom.ru",
  logo: "https://dsom.ru/og-default.jpg",
  taxID: "9707045838",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Краснопролетарская, 7",
    addressLocality: "Москва",
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
  const ogImage = image || "/og-default.jpg";
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
