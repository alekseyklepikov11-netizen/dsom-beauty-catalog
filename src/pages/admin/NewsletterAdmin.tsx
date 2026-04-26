import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Trash2, Search, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

interface Sub {
  id: string;
  email: string;
  source: string | null;
  consent_source: string | null;
  consent_at: string | null;
  is_active: boolean;
  unsubscribed_at: string | null;
  created_at: string;
}

const SOURCES = [
  { value: "", label: "Все источники" },
  { value: "registration", label: "Регистрация" },
  { value: "footer", label: "Форма в подвале" },
  { value: "account", label: "Личный кабинет" },
];

const STATUSES = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "inactive", label: "Отписавшиеся" },
];

const NewsletterAdmin = () => {
  const [rows, setRows] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("active");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) toast.error(error.message);
    setRows((data || []) as Sub[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (q && !r.email.toLowerCase().includes(q.toLowerCase())) return false;
      if (source && (r.consent_source || r.source) !== source) return false;
      if (status === "active" && !r.is_active) return false;
      if (status === "inactive" && r.is_active) return false;
      return true;
    });
  }, [rows, q, source, status]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.is_active).length,
    inactive: rows.filter((r) => !r.is_active).length,
  }), [rows]);

  const remove = async (id: string) => {
    if (!confirm("Удалить подписчика? Это действие необратимо.")) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const exportCsv = () => {
    const header = "email,source,consent_source,consent_at,is_active,unsubscribed_at,created_at\n";
    const body = filtered
      .map((r) => [r.email, r.source || "", r.consent_source || "", r.consent_at || "", r.is_active, r.unsubscribed_at || "", r.created_at].join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dsom-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl">База подписчиков</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Активных: {stats.active} · Отписалось: {stats.inactive} · Всего: {stats.total}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/campaigns"
            className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm rounded-md hover:bg-secondary"
          >
            <Mail className="w-4 h-4" />
            Кампании
          </Link>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm rounded-md hover:bg-foreground/90 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Экспорт CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по email"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background"
          />
        </div>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="px-3 py-2 text-sm border border-border rounded-md bg-background">
          {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 text-sm border border-border rounded-md bg-background">
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Загрузка…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground italic">Подписчиков по фильтру не найдено.</p>
      ) : (
        <div className="border border-border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Источник</th>
                <th className="px-4 py-3">Согласие</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono">{r.email}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{r.consent_source || r.source || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.consent_at ? new Date(r.consent_at).toLocaleDateString("ru-RU") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.is_active ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-foreground/10 text-foreground">Активен</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive" title={r.unsubscribed_at ? new Date(r.unsubscribed_at).toLocaleString("ru-RU") : ""}>
                        Отписан
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default NewsletterAdmin;
