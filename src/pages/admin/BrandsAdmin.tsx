import { useEffect, useState } from "react";
import { Plus, Eye, EyeOff, Trash2, Loader2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import I18nField, { Field, fieldCls } from "@/components/admin/I18nField";
import ImageUpload from "@/components/admin/ImageUpload";

interface Brand {
  id?: string; slug: string; name: string; name_en: string | null;
  description: string | null; description_en: string | null;
  country: string | null; logo_url: string | null;
  is_visible: boolean; sort_order: number;
}

const empty = (): Brand => ({
  slug: "", name: "", name_en: "", description: "", description_en: "",
  country: "", logo_url: null, is_visible: true, sort_order: 0,
});

const BrandsAdmin = () => {
  const [rows, setRows] = useState<Brand[]>([]);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("brands").select("*").order("sort_order");
    setRows((data || []) as Brand[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.name || !editing.slug) return toast.error("Название и slug обязательны");
    setSaving(true);
    try {
      const payload: any = { ...editing };
      delete payload.id;
      if (editing.id) {
        const { error } = await supabase.from("brands").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brands").insert(payload);
        if (error) throw error;
      }
      toast.success("Сохранено");
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (b: Brand) => {
    if (!confirm(`Удалить «${b.name}»?`)) return;
    const { error } = await supabase.from("brands").delete().eq("id", b.id!);
    if (error) return toast.error(error.message);
    load();
  };

  const toggle = async (b: Brand) => {
    await supabase.from("brands").update({ is_visible: !b.is_visible }).eq("id", b.id!);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— Бренды</p>
          <h1 className="font-display text-5xl">Бренды</h1>
        </div>
        <button onClick={() => setEditing(empty())} className="inline-flex items-center gap-2 bg-foreground text-background rounded-full pl-5 pr-2 py-2 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors">
          Новый бренд
          <span className="grid place-items-center w-7 h-7 rounded-full bg-background/15"><Plus className="w-3.5 h-3.5" /></span>
        </button>
      </div>

      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Загрузка…</p> : (
          <ul className="divide-y divide-border">
            {rows.map((b) => (
              <li key={b.id} className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 bg-secondary rounded grid place-items-center overflow-hidden">
                  {b.logo_url ? <img src={b.logo_url} alt="" className="w-full h-full object-contain" /> : <span className="font-display">{b.name[0]}</span>}
                </div>
                <div className="flex-1">
                  <p className="font-display text-lg">{b.name}</p>
                  <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">{b.slug} {b.country && `· ${b.country}`}</p>
                </div>
                <button onClick={() => toggle(b)} className="p-2 rounded hover:bg-secondary">
                  {b.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={() => setEditing(b)} className="text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground px-2">Изм.</button>
                <button onClick={() => remove(b)} className="p-2 rounded hover:bg-destructive/10 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="bg-background rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-3xl">{editing.id ? "Изменить бренд" : "Новый бренд"}</h2>
              <button onClick={() => setEditing(null)} className="p-2 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              <I18nField label="Название" valueRu={editing.name} valueEn={editing.name_en || ""}
                onChangeRu={(v) => setEditing({ ...editing, name: v, slug: editing.slug || v.toLowerCase().replace(/\s+/g, "-") })}
                onChangeEn={(v) => setEditing({ ...editing, name_en: v })} />
              <I18nField label="Описание" textarea valueRu={editing.description || ""} valueEn={editing.description_en || ""}
                onChangeRu={(v) => setEditing({ ...editing, description: v })}
                onChangeEn={(v) => setEditing({ ...editing, description_en: v })} />
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Slug"><input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className={fieldCls} /></Field>
                <Field label="Страна"><input value={editing.country || ""} onChange={(e) => setEditing({ ...editing, country: e.target.value })} className={fieldCls} placeholder="France" /></Field>
                <Field label="Сортировка"><input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className={fieldCls} /></Field>
              </div>
              <div className="max-w-xs">
                <ImageUpload bucket="brand-logos" value={editing.logo_url} onChange={(url) => setEditing({ ...editing, logo_url: url })} label="Логотип" aspect="aspect-square" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editing.is_visible} onChange={(e) => setEditing({ ...editing, is_visible: e.target.checked })} /> Виден на сайте
              </label>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="text-[11px] tracking-luxe uppercase px-5 py-2.5 hover:text-accent">Отмена</button>
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

export default BrandsAdmin;
