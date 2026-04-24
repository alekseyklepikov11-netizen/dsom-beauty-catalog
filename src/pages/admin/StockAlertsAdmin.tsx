import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

interface Alert {
  id: string;
  email: string;
  is_notified: boolean;
  notified_at: string | null;
  created_at: string;
  product_id: string;
  product?: { name: string; slug: string } | null;
}

type FilterKey = "pending" | "notified" | "all";

const StockAlertsAdmin = () => {
  const [rows, setRows] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("stock_alerts")
      .select("id,email,is_notified,notified_at,created_at,product_id, product:products(name,slug)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (filter === "pending") q = q.eq("is_notified", false);
    else if (filter === "notified") q = q.eq("is_notified", true);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const markNotified = async (a: Alert) => {
    const { error } = await supabase
      .from("stock_alerts")
      .update({ is_notified: true, notified_at: new Date().toISOString() })
      .eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Отмечено");
    load();
  };

  const remove = async (a: Alert) => {
    if (!confirm("Удалить подписку?")) return;
    const { error } = await supabase.from("stock_alerts").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    load();
  };

  const grouped = rows.reduce<Record<string, Alert[]>>((acc, r) => {
    const key = r.product_id;
    (acc[key] = acc[key] || []).push(r);
    return acc;
  }, {});

  const TABS: { key: FilterKey; label: string }[] = [
    { key: "pending", label: "Ожидают" },
    { key: "notified", label: "Отправлены" },
    { key: "all", label: "Все" },
  ];

  return (
    <AdminLayout>
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-5xl">Уведомления о поступлении</h1>
          <p className="text-sm text-muted-foreground mt-2">Подписки покупателей на оповещения</p>
        </div>
        <div className="flex items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-[11px] tracking-luxe uppercase rounded-full transition-colors ${
                filter === tab.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Загрузка…</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-muted-foreground py-20 italic">Нет подписок</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([pid, alerts]) => {
            const product = alerts[0].product;
            return (
              <div key={pid} className="bg-background border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                  <Bell className="w-4 h-4 text-accent" />
                  <Link to={product ? `/product/${product.slug}` : "#"} className="font-display text-xl hover:text-accent">
                    {product?.name || "Удалённый товар"}
                  </Link>
                  <span className="text-xs text-muted-foreground ml-auto">{alerts.length} подписок</span>
                </div>
                <ul className="divide-y divide-border">
                  {alerts.map((a) => (
                    <li key={a.id} className="flex items-center gap-4 py-3">
                      <span className={`w-2 h-2 rounded-full ${a.is_notified ? "bg-muted-foreground" : "bg-accent"}`} />
                      <a href={`mailto:${a.email}`} className="text-sm hover:text-accent">{a.email}</a>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(a.created_at).toLocaleDateString("ru-RU")}
                      </span>
                      {!a.is_notified && (
                        <button
                          onClick={() => markNotified(a)}
                          className="p-2 rounded hover:bg-accent/10 text-accent"
                          title="Отметить как отправлено"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => remove(a)} className="p-2 rounded hover:bg-destructive/10 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default StockAlertsAdmin;
