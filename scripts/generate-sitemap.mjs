/**
 * Генератор sitemap.xml для DSOM.
 * Запускается перед `vite build`. Тянет products + pages из публичного Supabase
 * через REST с anon-ключом, формирует sitemap.xml в public/.
 *
 * Использование:
 *   node scripts/generate-sitemap.mjs
 *
 * ENV:
 *   VITE_SUPABASE_URL              — например https://new.dsom.ru
 *   VITE_SUPABASE_PUBLISHABLE_KEY  — anon-ключ
 *   SITEMAP_BASE_URL               — по умолчанию https://dsom.ru
 */
import fs from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://new.dsom.ru";
const ANON = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const BASE = (process.env.SITEMAP_BASE_URL || "https://dsom.ru").replace(/\/$/, "");
const OUT = path.resolve("public/sitemap.xml");

// Только маршруты, которых НЕТ в таблице pages (иначе дубли: статик + БД).
// Все /page/* и /product/* подтягиваются из Supabase ниже.
const STATIC_PAGES = [
  { loc: "/", priority: 1.0, change: "weekly" },
  { loc: "/catalog", priority: 0.9, change: "weekly" },
  { loc: "/quiz", priority: 0.7, change: "monthly" },
];

async function rest(table, qs = "select=*") {
  if (!ANON) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  if (!res.ok) {
    console.error(`[sitemap] ${table} failed: HTTP ${res.status}`);
    return [];
  }
  return res.json();
}

function xmlUrl({ loc, lastmod, priority = 0.5, change = "monthly" }) {
  const u = `${BASE}${loc}`;
  return `  <url>
    <loc>${u}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${change}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

(async () => {
  const products = await rest("products", "select=slug,updated_at&is_visible=eq.true");
  const pages = await rest("pages", "select=slug,updated_at&is_published=eq.true");
  const today = new Date().toISOString().slice(0, 10);

  const urls = [
    ...STATIC_PAGES.map((p) => xmlUrl({ ...p, lastmod: today })),
    ...products.map((p) => xmlUrl({
      loc: `/product/${p.slug}`,
      lastmod: (p.updated_at || today).slice(0, 10),
      priority: 0.8,
      change: "weekly",
    })),
    ...pages.map((p) => xmlUrl({
      loc: `/page/${p.slug}`,
      lastmod: (p.updated_at || today).slice(0, 10),
      priority: 0.5,
      change: "monthly",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;

  await fs.writeFile(OUT, xml, "utf-8");
  console.log(`[sitemap] wrote ${urls.length} urls → ${OUT}`);
})().catch((e) => {
  console.error("[sitemap] fatal:", e);
  process.exit(1);
});
