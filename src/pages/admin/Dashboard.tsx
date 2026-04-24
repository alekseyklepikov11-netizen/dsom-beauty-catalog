import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package, Tag, Building2, Store, Image as ImageIcon, ArrowUpRight,
  Eye, ExternalLink, Mail, Search as SearchIcon,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

const StatCard = ({ label, value, to, icon: Icon, accent }: { label: string; value: number | string; to?: string; icon: any; accent?: boolean }) => {
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <Icon className={`w-5 h-5 ${accent ? "text-accent" : "text-foreground/60"}`} />
        {to && <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />}
      </div>
      <p className="font-display text-4xl md:text-5xl mt-6">{value}</p>
      <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mt-2">{label}</p>
    </>
  );
  return to ? (
    <Link to={to} className="group bg-background rounded-2xl p-5 md:p-6 hover:shadow-soft transition-all">{inner}</Link>
  ) : (
    <div className="bg-background rounded-2xl p-5 md:p-6">{inner}</div>
  );
};

interface DailyPoint { date: string; views: number; clicks: number }
interface TopProduct { id: string; name: string; views: number }
interface TopMarketplace { kind: string; clicks: number }
interface TopSearch { query: string; count: number }

const RANGE_DAYS = 30;

const Dashboard = () => {
  const [counts, setCounts] = useState({
    products: 0, categories: 0, brands: 0, stores: 0, banners: 0,
    subscribers: 0, productViews: 0, marketplaceClicks: 0,
  });
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topMarketplaces, setTopMarketplaces] = useState<TopMarketplace[]>([]);
  const [topSearches, setTopSearches] = useState<TopSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - RANGE_DAYS * 86400_000).toISOString();

      const [pCount, cCount, bCount, sCount, bnCount, subsCount, viewsCount, mpCount, events, productsList] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase.from("brands").select("*", { count: "exact", head: true }),
        supabase.from("stores").select("*", { count: "exact", head: true }),
        supabase.from("banners").select("*", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "product_view").gte("created_at", since),
        supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "marketplace_click").gte("created_at", since),
        supabase.from("analytics_events")
          .select("event_type, product_id, value, created_at")
          .in("event_type", ["product_view", "marketplace_click", "search_query"])
          .gte("created_at", since)
          .limit(5000),
        supabase.from("products").select("id,name").limit(1000),
      ]);

      setCounts({
        products: pCount.count || 0,
        categories: cCount.count || 0,
        brands: bCount.count || 0,
        stores: sCount.count || 0,
        banners: bnCount.count || 0,
        subscribers: subsCount.count || 0,
        productViews: viewsCount.count || 0,
        marketplaceClicks: mpCount.count || 0,
      });

      const evts = (events.data || []) as Array<{ event_type: string; product_id: string | null; value: string | null; created_at: string }>;
      const prodMap = new Map<string, string>(((productsList.data || []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]));

      // Daily series (views vs marketplace clicks)
      const buckets: Record<string, { views: number; clicks: number }> = {};
      for (let i = RANGE_DAYS - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
        buckets[d] = { views: 0, clicks: 0 };
      }
      for (const e of evts) {
        const d = e.created_at.slice(0, 10);
        if (!buckets[d]) continue;
        if (e.event_type === "product_view") buckets[d].views++;
        else if (e.event_type === "marketplace_click") buckets[d].clicks++;
      }
      setDaily(Object.entries(buckets).map(([date, v]) => ({ date: date.slice(5), views: v.views, clicks: v.clicks })));

      // Top viewed products
      const viewMap: Record<string, number> = {};
      for (const e of evts) {
        if (e.event_type === "product_view" && e.product_id) {
          viewMap[e.product_id] = (viewMap[e.product_id] || 0) + 1;
        }
      }
      setTopProducts(
        Object.entries(viewMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([id, views]) => ({ id, name: prodMap.get(id) || "—", views }))
      );

      // Top marketplaces
      const mpMap: Record<string, number> = {};
      for (const e of evts) {
        if (e.event_type === "marketplace_click" && e.value) {
          mpMap[e.value] = (mpMap[e.value] || 0) + 1;
        }
      }
      setTopMarketplaces(
        Object.entries(mpMap)
          .sort((a, b) => b[1] - a[1])
          .map(([kind, clicks]) => ({ kind, clicks }))
      );

      // Top searches
      const sMap: Record<string, number> = {};
      for (const e of evts) {
        if (e.event_type === "search_query" && e.value) {
          const k = e.value.toLowerCase().trim();
          if (k.length >= 2) sMap[k] = (sMap[k] || 0) + 1;
        }
      }
      setTopSearches(
        Object.entries(sMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([query, count]) => ({ query, count }))
      );

      setLoading(false);
    })();
  }, []);

  const mpLabel: Record<string, string> = {
    wildberries: "Wildberries",
    ozon: "Ozon",
    yandex_market: "Я.Маркет",
    goldapple: "Goldapple",
    other: "Другое",
  };

  return (
    <AdminLayout>
      <div className="mb-10">
        <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— Обзор · последние {RANGE_DAYS} дней</p>
        <h1 className="font-display text-5xl md:text-6xl">Панель управления</h1>
        <p className="text-sm text-muted-foreground mt-3">Активность посетителей и состояние каталога DSOM.</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
        <StatCard label="Просмотры товаров" value={counts.productViews.toLocaleString("ru-RU")} icon={Eye} accent />
        <StatCard label="Переходы на маркетплейсы" value={counts.marketplaceClicks.toLocaleString("ru-RU")} icon={ExternalLink} accent />
        <StatCard label="Подписчики email" value={counts.subscribers.toLocaleString("ru-RU")} to="/admin/newsletter" icon={Mail} accent />
        <StatCard
          label="Конверсия в маркетплейс"
          value={counts.productViews > 0 ? `${((counts.marketplaceClicks / counts.productViews) * 100).toFixed(1)}%` : "—"}
          icon={ArrowUpRight}
          accent
        />
      </div>

      {/* Catalog counts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-10">
        <StatCard label="Товаров" value={counts.products} to="/admin/products" icon={Package} />
        <StatCard label="Категорий" value={counts.categories} to="/admin/categories" icon={Tag} />
        <StatCard label="Брендов" value={counts.brands} to="/admin/brands" icon={Building2} />
        <StatCard label="Магазинов" value={counts.stores} to="/admin/stores" icon={Store} />
        <StatCard label="Баннеров" value={counts.banners} to="/admin/banners" icon={ImageIcon} />
      </div>

      {/* Daily chart */}
      <div className="bg-background rounded-2xl p-5 md:p-7 mb-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">Активность по дням</p>
            <h2 className="font-display text-2xl mt-1">Просмотры и переходы</h2>
          </div>
          <div className="flex items-center gap-4 text-[10px] tracking-luxe uppercase">
            <span className="flex items-center gap-2"><span className="w-3 h-0.5 bg-foreground" />Просмотры</span>
            <span className="flex items-center gap-2"><span className="w-3 h-0.5 bg-accent" />Переходы</span>
          </div>
        </div>
        {loading ? (
          <div className="h-64 grid place-items-center text-sm text-muted-foreground">Загрузка…</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={daily} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="views" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="clicks" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top products */}
        <div className="bg-background rounded-2xl p-5 md:p-7">
          <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">Топ-просматриваемые</p>
          <h2 className="font-display text-2xl mt-1 mb-5">Популярные товары</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Пока нет данных</p>
          ) : (
            <ul className="divide-y divide-border">
              {topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-4 py-3">
                  <span className="font-display text-2xl text-muted-foreground/40 w-8">{(i + 1).toString().padStart(2, "0")}</span>
                  <Link to={`/admin/products/${p.id}`} className="flex-1 text-sm font-medium truncate hover:text-accent">{p.name}</Link>
                  <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">{p.views} просм.</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Marketplaces */}
        <div className="bg-background rounded-2xl p-5 md:p-7">
          <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">Куда уходят</p>
          <h2 className="font-display text-2xl mt-1 mb-5">Переходы на маркетплейсы</h2>
          {topMarketplaces.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Пока нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topMarketplaces.map((m) => ({ name: mpLabel[m.kind] || m.kind, clicks: m.clicks }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="clicks" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top searches */}
      <div className="bg-background rounded-2xl p-5 md:p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">Что ищут на сайте</p>
            <h2 className="font-display text-2xl mt-1">Поисковые запросы</h2>
          </div>
          <SearchIcon className="w-5 h-5 text-muted-foreground/40" />
        </div>
        {topSearches.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Пока нет данных</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topSearches.map((s) => (
              <span key={s.query} className="inline-flex items-center gap-2 bg-secondary rounded-full px-4 py-2 text-xs">
                <span>{s.query}</span>
                <span className="text-muted-foreground text-[10px]">×{s.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
