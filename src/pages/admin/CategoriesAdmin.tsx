import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, X, Loader2, Save, FolderPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import I18nField, { Field, fieldCls } from "@/components/admin/I18nField";

interface Cat {
  id?: string; slug: string; name: string; name_en: string | null;
  description: string | null; description_en: string | null;
  parent_id: string | null; is_visible: boolean; sort_order: number;
}

const empty = (): Cat => ({
  slug: "", name: "", name_en: "", description: "", description_en: "",
  parent_id: null, is_visible: true, sort_order: 0,
});

const CategoriesAdmin = () => {
  const [rows, setRows] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setRows((data || []) as Cat[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const parents = rows.filter((r) => !r.parent_id);
  const childrenOf = (pid: string) => rows.filter((r) => r.parent_id === pid);
  const newSubcategory = (parentId: string) => {
    const siblings = childrenOf(parentId);
    setEditing({ ...empty(), parent_id: parentId, sort_order: siblings.length + 1 });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name || !editing.slug) return toast.error("Название и slug обязательны");
    setSaving(true);
    try {
      const payload: any = { ...editing }; delete payload.id;
      if (editing.id) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
      toast.success("Сохранено"); setEditing(null); load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (c: Cat) => {
    if (!confirm(`Удалить «${c.name}»?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id!);
    if (error) return toast.error(error.message);
    load();
  };

  const toggle = async (c: Cat) => {
    await supabase.from("categories").update({ is_visible: !c.is_visible }).eq("id", c.id!);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— Каталог</p>
          <h1 className="font-display text-5xl">Категории</h1>
        </div>
        <button onClick={() => setEditing(empty())} className="inline-flex items-center gap-2 bg-foreground text-background rounded-full pl-5 pr-2 py-2 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors">
          Новая категория
          <span className="grid place-items-center w-7 h-7 rounded-full bg-background/15"><Plus className="w-3.5 h-3.5" /></span>
        </button>
      </div>

      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Загрузка…</p> : (
          <ul className="divide-y divide-border">
            {parents.map((c) => (
              <li key={c.id}>
                <div className="flex items-center gap-4 p-4">
                  <div className="flex-1">
                    <p className="font-display text-lg">{c.name}</p>
                    <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">{c.slug}</p>
                  </div>
                  <button onClick={() => toggle(c)} className="p-2 rounded hover:bg-secondary">
                    {c.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => setEditing(c)} className="text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground px-2">Изм.</button>
                  <button onClick={() => remove(c)} className="p-2 rounded hover:bg-destructive/10 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {childrenOf(c.id!).length > 0 && (
                  <ul className="bg-secondary/40 border-t border-border">
                    {childrenOf(c.id!).map((sc) => (
                      <li key={sc.id} className="flex items-center gap-4 p-3 pl-12 border-b border-border last:border-b-0">
                        <div className="flex-1">
                          <p className="text-sm">{sc.name}</p>
                          <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">{sc.slug}</p>
                        </div>
                        <button onClick={() => toggle(sc)} className="p-2 rounded hover:bg-secondary">
                          {sc.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <button onClick={() => setEditing(sc)} className="text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground px-2">Изм.</button>
                        <button onClick={() => remove(sc)} className="p-2 rounded hover:bg-destructive/10 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="bg-background rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-3xl">{editing.id ? "Изменить категорию" : "Новая категория"}</h2>
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
                <Field label="Родительская">
                  <select value={editing.parent_id || ""} onChange={(e) => setEditing({ ...editing, parent_id: e.target.value || null })} className={fieldCls}>
                    <option value="">— (категория верхнего уровня)</option>
                    {parents.filter((p) => p.id !== editing.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
                <Field label="Сортировка"><input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className={fieldCls} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editing.is_visible} onChange={(e) => setEditing({ ...editing, is_visible: e.target.checked })} /> Видна на сайте
              </label>
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

export default CategoriesAdmin;
