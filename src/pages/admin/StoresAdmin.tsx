import { useEffect, useState } from "react";
import { Plus, Trash2, X, Loader2, Save, Eye, EyeOff, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Field, fieldCls } from "@/components/admin/I18nField";

interface Store {
  id?: string; name: string; city: string; address: string;
  hours: string | null; phone: string | null;
  latitude: number | null; longitude: number | null;
  is_active: boolean;
}
interface ProductMini { id: string; name: string }

const empty = (): Store => ({
  name: "", city: "", address: "", hours: "", phone: "",
  latitude: null, longitude: null, is_active: true,
});

const StoresAdmin = () => {
  const [rows, setRows] = useState<Store[]>([]);
  const [editing, setEditing] = useState<Store | null>(null);
  const [products, setProducts] = useState<ProductMini[]>([]);
  const [stocked, setStocked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("stores").select("*").order("city").order("name");
    setRows((data || []) as Store[]);
    setLoading(false);
  };
  useEffect(() => { load(); supabase.from("products").select("id,name").order("name").then(({ data }) => setProducts((data || []) as ProductMini[])); }, []);

  const openEdit = async (s: Store) => {
    setEditing(s);
    if (s.id) {
      const { data } = await supabase.from("store_inventory").select("product_id").eq("store_id", s.id).eq("in_stock", true);
      setStocked(new Set((data || []).map((r) => r.product_id)));
    } else {
      setStocked(new Set());
    }
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name || !editing.city || !editing.address) return toast.error("Название, город и адрес обязательны");
    setSaving(true);
    try {
      const payload: any = { ...editing }; delete payload.id;
      let sid = editing.id;
      if (sid) {
        const { error } = await supabase.from("stores").update(payload).eq("id", sid);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("stores").insert(payload).select("id").single();
        if (error) throw error;
        sid = data.id;
      }
      // Replace inventory
      await supabase.from("store_inventory").delete().eq("store_id", sid!);
      if (stocked.size) {
        await supabase.from("store_inventory").insert(
          Array.from(stocked).map((pid) => ({ store_id: sid!, product_id: pid, in_stock: true }))
        );
      }
      toast.success("Сохранено");
      setEditing(null); load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (s: Store) => {
    if (!confirm(`Удалить «${s.name}»?`)) return;
    const { error } = await supabase.from("stores").delete().eq("id", s.id!);
    if (error) return toast.error(error.message);
    load();
  };

  const toggle = async (s: Store) => {
    await supabase.from("stores").update({ is_active: !s.is_active }).eq("id", s.id!);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— Где купить</p>
          <h1 className="font-display text-5xl">Офлайн-магазины</h1>
        </div>
        <button onClick={() => openEdit(empty())} className="inline-flex items-center gap-2 bg-foreground text-background rounded-full pl-5 pr-2 py-2 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors">
          Новый магазин
          <span className="grid place-items-center w-7 h-7 rounded-full bg-background/15"><Plus className="w-3.5 h-3.5" /></span>
        </button>
      </div>

      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Загрузка…</p> : (
          <ul className="divide-y divide-border">
            {rows.map((s) => (
              <li key={s.id} className="flex items-center gap-4 p-4">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.city} · {s.address}</p>
                </div>
                <button onClick={() => toggle(s)} className="p-2 rounded hover:bg-secondary">
                  {s.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={() => openEdit(s)} className="text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground px-2">Изм.</button>
                <button onClick={() => remove(s)} className="p-2 rounded hover:bg-destructive/10 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="bg-background rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-3xl">{editing.id ? "Изменить магазин" : "Новый магазин"}</h2>
              <button onClick={() => setEditing(null)} className="p-2 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              <Field label="Название"><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={fieldCls} /></Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Город"><input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} className={fieldCls} /></Field>
                <Field label="Телефон"><input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className={fieldCls} /></Field>
              </div>
              <Field label="Адрес"><input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} className={fieldCls} /></Field>
              <Field label="Часы работы"><input value={editing.hours || ""} onChange={(e) => setEditing({ ...editing, hours: e.target.value })} placeholder="Пн–Вс 10:00–22:00" className={fieldCls} /></Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Широта"><input type="number" step="0.000001" value={editing.latitude ?? ""} onChange={(e) => setEditing({ ...editing, latitude: e.target.value ? Number(e.target.value) : null })} className={fieldCls} /></Field>
                <Field label="Долгота"><input type="number" step="0.000001" value={editing.longitude ?? ""} onChange={(e) => setEditing({ ...editing, longitude: e.target.value ? Number(e.target.value) : null })} className={fieldCls} /></Field>
              </div>
              <div>
                <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-2">Товары в наличии ({stocked.size})</p>
                <div className="border border-border rounded-md max-h-64 overflow-y-auto p-2 space-y-1">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary cursor-pointer text-sm">
                      <input type="checkbox" checked={stocked.has(p.id)} onChange={(e) => {
                        const ns = new Set(stocked);
                        if (e.target.checked) ns.add(p.id); else ns.delete(p.id);
                        setStocked(ns);
                      }} />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Активен
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

export default StoresAdmin;
