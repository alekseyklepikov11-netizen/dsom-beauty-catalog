import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, MessageCircle, Mail, Trash2 } from "lucide-react";

interface Channel {
  id: string;
  slug: string;
  label: string;
  email: string;
  is_active: boolean;
  sort_order: number;
}

interface Ticket {
  id: string;
  channel_slug: string | null;
  user_email: string;
  user_name: string | null;
  subject: string | null;
  message: string;
  status: string;
  email_sent: boolean;
  email_error: string | null;
  forwarded_to: string | null;
  conversation_excerpt: string | null;
  created_at: string;
  meta: any;
}

const SupportAdmin = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: ch }, { data: tk }] = await Promise.all([
      supabase.from("support_channels").select("*").order("sort_order"),
      supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setChannels((ch || []) as Channel[]);
    setTickets((tk || []) as Ticket[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateChannel = (id: string, patch: Partial<Channel>) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const saveChannel = async (c: Channel) => {
    setSaving(c.id);
    const { error } = await supabase
      .from("support_channels")
      .update({
        email: c.email,
        label: c.label,
        is_active: c.is_active,
      })
      .eq("id", c.id);
    setSaving(null);
    if (error) {
      toast.error("Ошибка сохранения", { description: error.message });
    } else {
      toast.success("Канал сохранён");
    }
  };

  const updateTicketStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("support_tickets")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Ошибка", { description: error.message });
    } else {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    }
  };

  const deleteTicket = async (id: string) => {
    if (!confirm("Удалить обращение?")) return;
    const { error } = await supabase.from("support_tickets").delete().eq("id", id);
    if (error) toast.error("Ошибка", { description: error.message });
    else setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-2">
          Поддержка
        </p>
        <h1 className="font-display text-3xl">Каналы и обращения</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Email-адреса, на которые AI-чат пересылает обращения по категориям.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Загрузка...
        </div>
      ) : (
        <>
          {/* Channels */}
          <section className="mb-12">
            <h2 className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-4 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Email-адреса каналов
            </h2>
            <div className="space-y-2">
              {channels.map((c) => (
                <div
                  key={c.id}
                  className="bg-background border border-border rounded-md p-4 flex flex-col md:flex-row md:items-center gap-3"
                >
                  <div className="md:w-48">
                    <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">
                      {c.slug}
                    </p>
                    <input
                      type="text"
                      value={c.label}
                      onChange={(e) => updateChannel(c.id, { label: e.target.value })}
                      className="bg-transparent text-sm font-medium w-full outline-none focus:underline"
                    />
                  </div>
                  <input
                    type="email"
                    value={c.email}
                    onChange={(e) => updateChannel(c.id, { email: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-input rounded bg-background"
                    placeholder="email@dsom.ru"
                  />
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={c.is_active}
                      onChange={(e) => updateChannel(c.id, { is_active: e.target.checked })}
                    />
                    Активен
                  </label>
                  <button
                    type="button"
                    onClick={() => saveChannel(c)}
                    disabled={saving === c.id}
                    className="px-4 py-2 bg-foreground text-background text-[11px] tracking-luxe uppercase rounded flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving === c.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Сохранить
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Tickets */}
          <section>
            <h2 className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-4 flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5" /> Обращения из чата ({tickets.length})
            </h2>
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Обращений пока нет.</p>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <details
                    key={t.id}
                    className="bg-background border border-border rounded-md"
                  >
                    <summary className="cursor-pointer p-4 flex items-center justify-between gap-3 list-none">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] tracking-luxe uppercase px-2 py-0.5 bg-secondary rounded">
                            {t.channel_slug || "—"}
                          </span>
                          <span
                            className={`text-[10px] tracking-luxe uppercase px-2 py-0.5 rounded ${
                              t.status === "new"
                                ? "bg-primary/10 text-primary"
                                : t.status === "done"
                                ? "bg-green-500/10 text-green-700"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {t.status}
                          </span>
                          {!t.email_sent && (
                            <span className="text-[10px] tracking-luxe uppercase px-2 py-0.5 bg-destructive/10 text-destructive rounded">
                              email не отправлен
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {new Date(t.created_at).toLocaleString("ru-RU")}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">
                          {t.subject || "(без темы)"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {t.user_name ? `${t.user_name} · ` : ""}
                          {t.user_email}
                        </p>
                      </div>
                    </summary>

                    <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                      <div>
                        <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-1">
                          Сообщение
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{t.message}</p>
                      </div>
                      {t.conversation_excerpt && (
                        <div>
                          <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-1">
                            Контекст диалога
                          </p>
                          <pre className="text-xs whitespace-pre-wrap font-mono bg-secondary/50 p-3 rounded">
                            {t.conversation_excerpt}
                          </pre>
                        </div>
                      )}
                      {t.meta?.user_contact && (
                        <p className="text-xs">
                          <span className="text-muted-foreground">Доп. контакт:</span>{" "}
                          {t.meta.user_contact}
                        </p>
                      )}
                      {t.forwarded_to && (
                        <p className="text-xs">
                          <span className="text-muted-foreground">Отправлено на:</span>{" "}
                          {t.forwarded_to}
                        </p>
                      )}
                      {t.email_error && (
                        <p className="text-xs text-destructive">
                          Ошибка email: {t.email_error}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        <select
                          value={t.status}
                          onChange={(e) => updateTicketStatus(t.id, e.target.value)}
                          className="text-xs px-3 py-1.5 border border-input rounded bg-background"
                        >
                          <option value="new">Новое</option>
                          <option value="in_progress">В работе</option>
                          <option value="done">Закрыто</option>
                        </select>
                        <a
                          href={`mailto:${t.user_email}?subject=Re: ${encodeURIComponent(t.subject || "Ваше обращение")}`}
                          className="text-xs px-3 py-1.5 border border-input rounded hover:bg-secondary"
                        >
                          Ответить
                        </a>
                        <button
                          type="button"
                          onClick={() => deleteTicket(t.id)}
                          className="text-xs px-3 py-1.5 text-destructive hover:bg-destructive/10 rounded ml-auto flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Удалить
                        </button>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
};

export default SupportAdmin;
