import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Mail, Trash2, Edit3, Send, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

interface Campaign {
  id: string;
  subject: string;
  preheader: string | null;
  status: string;
  segment: string;
  recipients_count: number;
  sent_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Черновик", cls: "bg-muted text-muted-foreground" },
  scheduled: { label: "Запланирована", cls: "bg-accent/15 text-accent" },
  sending: { label: "Отправляется", cls: "bg-foreground/10 text-foreground" },
  sent: { label: "Отправлена", cls: "bg-green-100 text-green-800" },
  failed: { label: "Ошибка", cls: "bg-destructive/10 text-destructive" },
};

const CampaignsAdmin = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data || []) as Campaign[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const { data, error } = await supabase
      .from("email_campaigns")
      .insert({
        subject: "Новая кампания",
        content_html: "<p>Здравствуйте!</p><p>Текст письма...</p>",
        segment: "all_active",
        status: "draft",
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    navigate(`/admin/campaigns/${data.id}`);
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить кампанию?")) return;
    const { error } = await supabase.from("email_campaigns").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <AdminLayout>
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl">Кампании рассылок</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Создавайте и отправляйте письма подписчикам DSOM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/newsletter" className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm rounded-md hover:bg-secondary">
            <Mail className="w-4 h-4" />
            База подписчиков
          </Link>
          <button onClick={create} className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm rounded-md hover:bg-foreground/90">
            <Plus className="w-4 h-4" />
            Новая кампания
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Загрузка…</p>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-border rounded-md p-12 text-center">
          <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Кампаний пока нет</p>
          <button onClick={create} className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm rounded-md hover:bg-foreground/90">
            <Plus className="w-4 h-4" />
            Создать первую
          </button>
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="px-4 py-3">Тема</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Получателей</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const st = STATUS_LABELS[c.status] || STATUS_LABELS.draft;
                return (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link to={`/admin/campaigns/${c.id}`} className="font-medium hover:underline">
                        {c.subject}
                      </Link>
                      {c.preheader && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.preheader}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.recipients_count || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {c.sent_at
                        ? `Отправлена ${new Date(c.sent_at).toLocaleString("ru-RU")}`
                        : `Изменена ${new Date(c.updated_at).toLocaleString("ru-RU")}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/campaigns/${c.id}`} className="text-muted-foreground hover:text-foreground">
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        {c.status !== "sent" && (
                          <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default CampaignsAdmin;
