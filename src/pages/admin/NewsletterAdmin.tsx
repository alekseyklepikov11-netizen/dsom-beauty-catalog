import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

interface Sub {
  id: string;
  email: string;
  source: string | null;
  is_active: boolean;
  created_at: string;
}

const NewsletterAdmin = () => {
  const [rows, setRows] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data || []) as Sub[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Удалить подписчика?")) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const exportCsv = () => {
    const header = "email,source,is_active,created_at\n";
    const body = rows
      .map((r) => `${r.email},${r.source || ""},${r.is_active},${r.created_at}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl">Подписчики рассылки</h1>
          <p className="text-sm text-muted-foreground mt-1">Всего: {rows.length}</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm rounded-md hover:bg-foreground/90 disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          Экспорт CSV
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Загрузка…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground italic">Подписчиков пока нет.</p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Источник</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono">{r.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.source || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("ru-RU")}
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
