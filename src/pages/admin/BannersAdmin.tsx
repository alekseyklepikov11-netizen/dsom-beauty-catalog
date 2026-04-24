import { useEffect, useState } from "react";
import { Plus, Trash2, X, Loader2, Save, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import I18nField, { Field, fieldCls } from "@/components/admin/I18nField";
import ImageUpload from "@/components/admin/ImageUpload";

interface Banner {
  id?: string; position: string;
  title: string; title_en: string | null;
  subtitle: string | null; subtitle_en: string | null;
  cta_label: string | null; cta_label_en: string | null;
  cta_url: string | null;
  image_url: string | null; video_url: string | null;
  is_active: boolean; sort_order: number;
  ab_group: string | null;
}

const empty = (): Banner => ({
  position: "home_hero", title: "", title_en: "", subtitle: "", subtitle_en: "",
  cta_label: "", cta_label_en: "", cta_url: "/catalog",
  image_url: null, video_url: "", is_active: true, sort_order: 0, ab_group: null,
});

const BannersAdmin = () => {
  const [rows, setRows] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("banners").select("*").order("position").order("sort_order");
    setRows((data || []) as Banner[]);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title) return toast.error("Заголовок обязателен");
    setSaving(true);
    try {
      const payload: any = { ...editing }; delete payload.id;
      if (editing.id) {
        const { error } = await supabase.from("banners").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(payload);
        if (error) throw error;
      }
      toast.success("Сохранено"); setEditing(null); load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (b: Banner) => {
    if (!confirm("Удалить баннер?")) return;
    await supabase.from("banners").delete().eq("id", b.id!);
    load();
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
        {rows.map((b) => (
          <div key={b.id} className="bg-background border border-border rounded-2xl overflow-hidden">
            <div className="aspect-video bg-secondary relative">
              {b.image_url && <img src={b.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              {b.video_url && <span className="absolute top-2 right-2 bg-foreground/80 text-background text-[10px] px-2 py-1 rounded tracking-luxe uppercase">Видео</span>}
            </div>
            <div className="p-5">
              <p className="text-[10px] tracking-luxe uppercase text-accent mb-2">{b.position}</p>
              <h3 className="font-display text-2xl leading-tight">{b.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{b.subtitle}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <button onClick={() => toggle(b)} className="text-[10px] tracking-luxe uppercase text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  {b.is_active ? <><Eye className="w-3 h-3" />Активен</> : <><EyeOff className="w-3 h-3" />Скрыт</>}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(b)} className="text-[10px] tracking-luxe uppercase hover:text-accent">Изм.</button>
                  <button onClick={() => remove(b)} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
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
                <ImageUpload bucket="banners" value={editing.image_url} onChange={(url) => setEditing({ ...editing, image_url: url })} label="Постер / изображение" aspect="aspect-video" />
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
