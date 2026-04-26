import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Send, Eye, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

interface Campaign {
  id: string;
  subject: string;
  preheader: string | null;
  content_html: string;
  segment: string;
  status: string;
  recipients_count: number;
  sent_at: string | null;
}

const SEGMENTS = [
  { value: "all_active", label: "Все активные подписчики" },
  { value: "registration", label: "Только зарегистрированные пользователи" },
  { value: "footer", label: "Подписчики из формы в подвале" },
];

const CampaignEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [c, setC] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientsCount, setRecipientsCount] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("email_campaigns").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        toast.error("Кампания не найдена");
        navigate("/admin/campaigns");
        return;
      }
      setC(data as Campaign);
      setLoading(false);
    })();
  }, [id, navigate]);

  // Подсчёт получателей по сегменту
  useEffect(() => {
    if (!c) return;
    (async () => {
      let query = supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("is_active", true);
      if (c.segment === "registration") query = query.eq("consent_source", "registration");
      else if (c.segment === "footer") query = query.eq("consent_source", "footer");
      const { count } = await query;
      setRecipientsCount(count || 0);
    })();
  }, [c?.segment]);

  const update = (patch: Partial<Campaign>) => setC((p) => (p ? { ...p, ...patch } : p));

  const save = async () => {
    if (!c) return;
    setSaving(true);
    const { error } = await supabase
      .from("email_campaigns")
      .update({
        subject: c.subject,
        preheader: c.preheader,
        content_html: c.content_html,
        segment: c.segment,
      })
      .eq("id", c.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Сохранено");
  };

  const send = async () => {
    if (!c) return;
    if (!confirm(`Отправить кампанию "${c.subject}" на ${recipientsCount || 0} получателей?\n\nДействие нельзя отменить.`)) return;
    setSending(true);
    // Фиксируем как "отправленную" — реальная отправка писем будет включена после подключения email-домена
    const { error } = await supabase
      .from("email_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        recipients_count: recipientsCount || 0,
      })
      .eq("id", c.id);
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Кампания зафиксирована. Реальная отправка писем будет включена после подключения email-домена dsom.ru.");
    navigate("/admin/campaigns");
  };

  if (loading || !c) {
    return (
      <AdminLayout>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Загрузка...
        </div>
      </AdminLayout>
    );
  }

  const isSent = c.status === "sent";

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link to="/admin/campaigns" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground tracking-luxe uppercase">
          <ArrowLeft className="w-3.5 h-3.5" />
          К кампаниям
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl">{isSent ? "Просмотр кампании" : "Редактор кампании"}</h1>
          {isSent && c.sent_at && (
            <p className="text-sm text-muted-foreground mt-1">
              Отправлена {new Date(c.sent_at).toLocaleString("ru-RU")} · {c.recipients_count} получателей
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview((p) => !p)} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm rounded-md hover:bg-secondary">
            <Eye className="w-4 h-4" />
            {preview ? "Редактор" : "Предпросмотр"}
          </button>
          {!isSent && (
            <>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm rounded-md hover:bg-secondary disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Сохранить
              </button>
              <button onClick={send} disabled={sending || !recipientsCount} className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm rounded-md hover:bg-foreground/90 disabled:opacity-50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Отправить
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        <div>
          {!preview ? (
            <div className="space-y-5">
              <div>
                <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Тема письма</label>
                <input
                  type="text"
                  value={c.subject}
                  disabled={isSent}
                  onChange={(e) => update({ subject: e.target.value })}
                  className="mt-1.5 w-full border border-border rounded-md px-3 py-2 text-sm bg-background disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Прехедер (превью в почтовике)</label>
                <input
                  type="text"
                  value={c.preheader || ""}
                  disabled={isSent}
                  onChange={(e) => update({ preheader: e.target.value })}
                  maxLength={150}
                  placeholder="Короткое описание, которое видно в списке писем"
                  className="mt-1.5 w-full border border-border rounded-md px-3 py-2 text-sm bg-background disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Содержимое письма (HTML)</label>
                <textarea
                  value={c.content_html}
                  disabled={isSent}
                  onChange={(e) => update({ content_html: e.target.value })}
                  rows={18}
                  className="mt-1.5 w-full border border-border rounded-md px-3 py-3 text-sm font-mono bg-background disabled:opacity-60"
                />
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  Поддерживается базовый HTML: &lt;p&gt;, &lt;h1&gt;-&lt;h3&gt;, &lt;a href&gt;, &lt;img src&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;/&lt;ol&gt;/&lt;li&gt;, &lt;br&gt;.
                  Ссылка отписки будет добавлена автоматически.
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-border rounded-md overflow-hidden">
              <div className="bg-secondary px-4 py-3 border-b border-border">
                <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">Тема</p>
                <p className="text-sm font-medium mt-0.5">{c.subject}</p>
                {c.preheader && <p className="text-xs text-muted-foreground mt-1">{c.preheader}</p>}
              </div>
              <div className="bg-white p-8 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: c.content_html }} />
              <div className="bg-secondary/50 px-4 py-4 border-t border-border text-center">
                <p className="text-[11px] text-muted-foreground">
                  Вы получили это письмо, потому что подписаны на рассылку DSOM.<br />
                  <span className="underline">Отписаться</span> · ООО «ВАЛКЭНДВИР»
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div>
            <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Сегмент</label>
            <select
              value={c.segment}
              disabled={isSent}
              onChange={(e) => update({ segment: e.target.value })}
              className="mt-1.5 w-full border border-border rounded-md px-3 py-2 text-sm bg-background disabled:opacity-60"
            >
              {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="border border-border rounded-md p-4 bg-secondary/40">
            <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">Получателей</p>
            <p className="font-display text-3xl mt-1">{recipientsCount ?? "..."}</p>
            <p className="text-xs text-muted-foreground mt-2">активных подписчиков в сегменте</p>
          </div>

          <div className="border border-amber-500/30 bg-amber-500/5 rounded-md p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-800">Реальная отправка</p>
                <p className="text-[11px] text-amber-700/80 mt-1 leading-relaxed">
                  Письма начнут уходить после подключения домена <strong>dsom.ru</strong> для email. Сейчас кампания сохраняется и фиксируется в истории.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
};

export default CampaignEdit;
