import { useEffect, useState } from "react";
import { Plus, Trash2, X, Loader2, Save, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import I18nField, { Field, fieldCls } from "@/components/admin/I18nField";
import ImageUpload from "@/components/admin/ImageUpload";
// classifyError/isRlsBlocked больше не используются — admin CRUD теперь
// через edge function admin-banners (см. callAdminBanners ниже).

interface Banner {
  id?: string; position: string;
  title: string; title_en: string | null;
  subtitle: string | null; subtitle_en: string | null;
  cta_label: string | null; cta_label_en: string | null;
  cta_url: string | null;
  image_url: string | null; video_url: string | null;
  is_active: boolean; sort_order: number;
  ab_group: string | null;
  text_position?: string | null;
  image_srcset?: Record<string, string> | null;
  image_focal_point?: string | null;
}

// 9-зон сетка вынесена в lib/banner-positions.ts (единый источник правды)
import { POSITIONS, POS_LABELS, FOCAL_POINTS } from "@/lib/banner-positions";

const TEXT_POSITIONS = POSITIONS.map((value) => ({ value, label: POS_LABELS[value] }));

const empty = (): Banner => ({
  position: "home_hero", title: "", title_en: "", subtitle: "", subtitle_en: "",
  cta_label: "", cta_label_en: "", cta_url: "/catalog",
  image_url: null, video_url: "", is_active: true, sort_order: 0, ab_group: null,
  text_position: "bottom-left", image_srcset: null, image_focal_point: "center center",
});

interface BannerStats { views: number; clicks: number }

const BannersAdmin = () => {
  const [rows, setRows] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<Record<string, BannerStats>>({});

  const load = async () => {
    const { data } = await supabase.from("banners").select("*").order("position").order("sort_order");
    const list = (data || []) as Banner[];
    setRows(list);

    // Load A/B stats
    const ids = list.map((b) => b.id).filter(Boolean) as string[];
    if (ids.length === 0) return;
    const { data: ev } = await supabase
      .from("analytics_events")
      .select("banner_id, event_type")
      .in("banner_id", ids)
      .in("event_type", ["banner_view", "banner_click"]);
    const acc: Record<string, BannerStats> = {};
    (ev || []).forEach((e: any) => {
      if (!e.banner_id) return;
      acc[e.banner_id] = acc[e.banner_id] || { views: 0, clicks: 0 };
      if (e.event_type === "banner_view") acc[e.banner_id].views++;
      else if (e.event_type === "banner_click") acc[e.banner_id].clicks++;
    });
    setStats(acc);
  };
  useEffect(() => { load(); }, []);

  // ============================================================
  // CRUD через edge function admin-banners — НЕ зависит от JWT-в-браузере
  // и фронтового RLS. Функция сама проверяет admin role через service_role,
  // потом делает операцию в обход RLS. Если JWT истёк/нет роли — 401/403.
  // ============================================================
  const callAdminBanners = async (action: "insert" | "update" | "delete", id?: string, payload?: any) => {
    const { data, error } = await supabase.functions.invoke("admin-banners", {
      body: { action, id, payload },
    });
    if (error) {
      // Edge function вернула HTTP error — JWT недействителен/нет роли/etc.
      throw new Error(error.message || "Edge function error");
    }
    if (!data?.ok) {
      throw new Error(data?.error || "Operation failed");
    }
    return data;
  };

  const handleAuthError = async (msg: string) => {
    toast.error(`${msg}. Перенаправляю на повторный логин...`);
    try { await supabase.auth.signOut(); } catch {}
    setTimeout(() => { window.location.href = "/admin/login"; }, 1200);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title) return toast.error("Заголовок обязателен");
    setSaving(true);
    try {
      if (editing.id) {
        await callAdminBanners("update", editing.id, editing);
      } else {
        await callAdminBanners("insert", undefined, editing);
      }
      toast.success("Сохранено");
      setEditing(null); load();
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes("expired") || msg.includes("Invalid") || msg.includes("Forbidden") || msg.includes("401") || msg.includes("403")) {
        return handleAuthError("Сессия истекла или нет admin-роли");
      }
      toast.error(`Ошибка сохранения: ${msg}`);
    } finally { setSaving(false); }
  };

  const remove = async (b: Banner) => {
    if (!confirm(`Удалить баннер «${b.title}»? Это действие необратимо.`)) return;
    try {
      const res = await callAdminBanners("delete", b.id);
      if (res.rowsAffected === 0) {
        toast.error("Удаление не дало эффекта — баннер уже был удалён или ID невалиден");
        return;
      }
      toast.success("Баннер удалён");
      load();
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes("expired") || msg.includes("Invalid") || msg.includes("Forbidden") || msg.includes("401") || msg.includes("403")) {
        return handleAuthError("Сессия истекла или нет admin-роли");
      }
      toast.error(`Не удалось удалить: ${msg}`);
    }
  };

  const toggle = async (b: Banner) => {
    await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id!);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— Главная</p>
          <h1 className="font-display text-5xl">Баннеры и видео</h1>
        </div>
        <button onClick={() => setEditing(empty())} className="inline-flex items-center gap-2 bg-foreground text-background rounded-full pl-5 pr-2 py-2 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors">
          Новый баннер
          <span className="grid place-items-center w-7 h-7 rounded-full bg-background/15"><Plus className="w-3.5 h-3.5" /></span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((b) => {
          const s = (b.id && stats[b.id]) || { views: 0, clicks: 0 };
          const ctr = s.views > 0 ? ((s.clicks / s.views) * 100).toFixed(1) : "—";
          return (
            <div key={b.id} className="bg-background border border-border rounded-2xl overflow-hidden">
              <div className="aspect-video bg-secondary relative">
                {b.image_url && <img src={b.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                {b.video_url && <span className="absolute top-2 right-2 bg-foreground/80 text-background text-[10px] px-2 py-1 rounded tracking-luxe uppercase">Видео</span>}
                {b.ab_group && <span className="absolute top-2 left-2 bg-accent text-background text-[10px] px-2 py-1 rounded tracking-luxe uppercase">A/B: {b.ab_group}</span>}
              </div>
              <div className="p-5">
                <p className="text-[10px] tracking-luxe uppercase text-accent mb-2">{b.position}</p>
                <h3 className="font-display text-2xl leading-tight">{b.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{b.subtitle}</p>

                {/* A/B stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-secondary/50 rounded p-2">
                    <p className="text-[9px] tracking-luxe uppercase text-muted-foreground">Показы</p>
                    <p className="font-display text-lg">{s.views}</p>
                  </div>
                  <div className="bg-secondary/50 rounded p-2">
                    <p className="text-[9px] tracking-luxe uppercase text-muted-foreground">Клики</p>
                    <p className="font-display text-lg">{s.clicks}</p>
                  </div>
                  <div className="bg-secondary/50 rounded p-2">
                    <p className="text-[9px] tracking-luxe uppercase text-muted-foreground">CTR</p>
                    <p className="font-display text-lg">{ctr}{s.views > 0 ? "%" : ""}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <button onClick={() => toggle(b)} className="text-[10px] tracking-luxe uppercase text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    {b.is_active ? <><Eye className="w-3 h-3" />Активен</> : <><EyeOff className="w-3 h-3" />Скрыт</>}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(b)}
                      className="text-[11px] tracking-luxe uppercase px-3 py-1.5 rounded-full border border-border hover:border-foreground hover:bg-secondary transition-colors"
                    >Редактировать</button>
                    <button
                      onClick={() => remove(b)}
                      className="inline-flex items-center gap-1.5 text-[11px] tracking-luxe uppercase px-3 py-1.5 rounded-full border border-destructive/40 text-destructive hover:bg-destructive hover:text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="bg-background rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-3xl">{editing.id ? "Изменить баннер" : "Новый баннер"}</h2>
              <button onClick={() => setEditing(null)} className="p-2 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              <Field label="Позиция">
                <select value={editing.position} onChange={(e) => setEditing({ ...editing, position: e.target.value })} className={fieldCls}>
                  <option value="home_hero">Главная — hero</option>
                  <option value="catalog_top">Каталог — верх</option>
                  <option value="about_top">О бренде — верх</option>
                </select>
              </Field>
              <Field label="Позиция текста на картинке (9 зон)">
                <select
                  value={editing.text_position || "bottom-left"}
                  onChange={(e) => setEditing({ ...editing, text_position: e.target.value })}
                  className={fieldCls}
                >
                  {TEXT_POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Выбирай зону так, чтобы заголовок не закрывал главный объект на картинке.
                  Виньетка-градиент автоматически подстраивается под выбранную зону для контрастности.
                </p>
              </Field>
              <Field label="Фокусная точка картинки (что видно при кропе)">
                <select
                  value={editing.image_focal_point || "center center"}
                  onChange={(e) => setEditing({ ...editing, image_focal_point: e.target.value })}
                  className={fieldCls}
                >
                  {FOCAL_POINTS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Когда aspect-ratio картинки не совпадает с баннером, лишнее обрезается.
                  Это поле говорит — КАКОЙ КУСОК сохранить. Например для вертикальной баночки
                  на горизонтальном баннере выбирай «Сверху · центр» — крышка-дроппер будет видна.
                </p>
              </Field>
              <I18nField label="Заголовок" valueRu={editing.title} valueEn={editing.title_en || ""}
                onChangeRu={(v) => setEditing({ ...editing, title: v })}
                onChangeEn={(v) => setEditing({ ...editing, title_en: v })} />
              <I18nField label="Подзаголовок" textarea valueRu={editing.subtitle || ""} valueEn={editing.subtitle_en || ""}
                onChangeRu={(v) => setEditing({ ...editing, subtitle: v })}
                onChangeEn={(v) => setEditing({ ...editing, subtitle_en: v })} />
              <I18nField label="CTA текст" valueRu={editing.cta_label || ""} valueEn={editing.cta_label_en || ""}
                onChangeRu={(v) => setEditing({ ...editing, cta_label: v })}
                onChangeEn={(v) => setEditing({ ...editing, cta_label_en: v })} />
              <Field label="CTA ссылка"><input value={editing.cta_url || ""} onChange={(e) => setEditing({ ...editing, cta_url: e.target.value })} className={fieldCls} /></Field>

              <div className="grid md:grid-cols-2 gap-4">
                <ImageUpload
                  bucket="banners"
                  value={editing.image_url}
                  /* functional setState — иначе при двойном вызове (onChange + onSrcsetChange
                     при клике «Убрать») второй setEditing использует stale editing из closure
                     и затирает image_url=null, картинка не пропадает */
                  onChange={(url) => setEditing((prev) => prev ? { ...prev, image_url: url } : prev)}
                  onSrcsetChange={(srcset) => setEditing((prev) => prev ? { ...prev, image_srcset: srcset } : prev)}
                  label="Постер / изображение (auto WebP ×3)"
                  aspect="aspect-video"
                />
                <Field label="Видео URL (mp4)">
                  <textarea value={editing.video_url || ""} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} rows={3} className={fieldCls + " resize-y"} placeholder="https://…/video.mp4" />
                  <p className="text-[10px] text-muted-foreground mt-1">Если видео указано — оно проигрывается на фоне hero. Изображение используется как poster.</p>
                </Field>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Сортировка"><input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className={fieldCls} /></Field>
                <label className="flex items-center gap-2 text-sm cursor-pointer pt-7">
                  <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Активен
                </label>
              </div>

              <Field label="A/B группа (необязательно)">
                <input
                  value={editing.ab_group || ""}
                  onChange={(e) => setEditing({ ...editing, ab_group: e.target.value || null })}
                  className={fieldCls}
                  placeholder="например: A или B"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Если в одной позиции активны несколько баннеров с разными A/B группами, посетителю случайно показывается один из них (50/50).
                  Сравните CTR в карточках выше.
                </p>
              </Field>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="text-[11px] tracking-luxe uppercase px-5 py-2.5">Отмена</button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-6 py-2.5 text-[11px] tracking-luxe uppercase hover:bg-accent disabled:opacity-60">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BannersAdmin;
