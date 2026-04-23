import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Tag, Building2, Store, Image as ImageIcon, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

const StatCard = ({ label, value, to, icon: Icon }: { label: string; value: number | string; to: string; icon: any }) => (
  <Link to={to} className="group bg-background rounded-2xl p-6 hover:shadow-soft transition-all">
    <div className="flex items-start justify-between">
      <Icon className="w-5 h-5 text-accent" />
      <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
    </div>
    <p className="font-display text-5xl mt-6">{value}</p>
    <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mt-2">{label}</p>
  </Link>
);

const Dashboard = () => {
  const [counts, setCounts] = useState({ products: 0, categories: 0, brands: 0, stores: 0, banners: 0 });

  useEffect(() => {
    (async () => {
      const [p, c, b, s, bn] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase.from("brands").select("*", { count: "exact", head: true }),
        supabase.from("stores").select("*", { count: "exact", head: true }),
        supabase.from("banners").select("*", { count: "exact", head: true }),
      ]);
      setCounts({
        products: p.count || 0, categories: c.count || 0, brands: b.count || 0,
        stores: s.count || 0, banners: bn.count || 0,
      });
    })();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-10">
        <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— Обзор</p>
        <h1 className="font-display text-5xl md:text-6xl">Панель управления</h1>
        <p className="text-sm text-muted-foreground mt-3">Управляйте контентом сайта DSOM.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Товаров" value={counts.products} to="/admin/products" icon={Package} />
        <StatCard label="Категорий" value={counts.categories} to="/admin/categories" icon={Tag} />
        <StatCard label="Брендов" value={counts.brands} to="/admin/brands" icon={Building2} />
        <StatCard label="Магазинов" value={counts.stores} to="/admin/stores" icon={Store} />
        <StatCard label="Баннеров" value={counts.banners} to="/admin/banners" icon={ImageIcon} />
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
