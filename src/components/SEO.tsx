import { Helmet } from "react-helmet-async";
import { toPublicAssetUrl } from "@/lib/utils";

interface Props {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, any> | Record<string, any>[];
  canonical?: string;
  noindex?: boolean;
}

const SITE_NAME = "DSOM";
const DEFAULT_DESCRIPTION =
  "DSOM — активная косметика для тех, кто читает состав: рабочие концентрации, механизм действия и честные границы эффекта — на упаковке.";

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
  sameAs: ["https://t.me/dsom_official", "https://vk.com/dsom_skin_care"],
};

const SITE_ORIGIN = "https://dsom.ru";

/** Канонический URL: всегда https://dsom.ru + путь, без query (utm_*, yclid, gclid…),
 *  без #hash и без завершающего слэша (кроме корня). */
function buildCanonical(raw?: string): string {
  let path = "";
  try {
    if (raw) {
      path = new URL(raw, SITE_ORIGIN).pathname;
    } else if (typeof window !== "undefined") {
      path = window.location.pathname;
    } else {
      return "";
    }
  } catch {
    return "";
  }
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return `${SITE_ORIGIN}${path || "/"}`;
}

const SEO = ({ title, description, image, type = "website", jsonLd, canonical, noindex }: Props) => {
  // Не дублируем бренд: если в title уже есть «DSOM», суффикс не дописываем.
  const fullTitle = title
    ? /DSOM/.test(title)
      ? title
      : `${title} — ${SITE_NAME}`
    : `${SITE_NAME} — Активная косметика с прозрачным составом`;
  const desc = description || DEFAULT_DESCRIPTION;
  const url = buildCanonical(canonical);
  const ogImageRaw = image || "/og-default.jpg";
  // og:image должен быть абсолютным URL, иначе соцсети/парсеры его не подхватывают.
  // Плюс переписываем new.dsom.ru → dsom.ru (тот же /storage/-путь, nginx отдаёт статику).
  const ogImage = toPublicAssetUrl(ogImageRaw.startsWith("http") ? ogImageRaw : `https://dsom.ru${ogImageRaw}`);
  const ldArr = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const allLd = [ORGANIZATION_JSONLD, ...ldArr];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex, follow" />}
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
