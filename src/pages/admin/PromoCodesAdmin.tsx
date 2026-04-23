import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

interface Promo {
  id?: string;
  code: string;
  description: string | null;
  description_en: string | null;
  discount_type: "percent" | "amount";
  discount_value: number;
  min_order_amount: number | null;
  expires_at: string | null;
  usage_limit: number | null;
  usage_count?: number;
  is_active: boolean;
  is_public: boolean;
  marketplace_url: string | null;
}

const empty = (): Promo => ({
  code: "",
  description: "",
  description_en: "",
  discount_type: "percent",
  discount_value: 10,
  min_order_amount: null,
  expires_at: null,
  usage_limit: null,
  is_active: true,
  is_public: true,
  marketplace_url: "",
});

const fieldCls = "w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const PromoCodesAdmin = () => {
  const [rows, setRows] = useState<Promo[]>([]);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setRows((data || []) as Promo[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.code.trim()) {
      toast.error("Код обязателен");
      return;
    }
    setSaving(true);
    const payload = {
      ...editing,
      code: editing.code.trim().toUpperCase(),
      expires_at: editing.expires_at || null,
      min_order_amount: editing.min_order_amount || null,
      usage_limit: editing.usage_limit || null,
      marketplace_url: editing.marketplace_url || null,
      description: editing.description || null,
      description_en: editing.description_en || null,
    };
    const { error } = editing.id
      ? await supabase.from("promo_codes").update(payload).eq("id", editing.id)
      : await supabase.from("promo_codes").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Сохранено");
    setEditing(null);
    load();
  };

  const remove = async (p: Promo) => {
    if (!p.id || !confirm(`Удалить код ${p.code}?`)) return;
    const { error } = await supabase.from("promo_codes").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== p.id));
  };

  const toggle = async (p: Promo) => {
    if (!p.id) return;
    const { error } = await supabase.from("promo_codes").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.id === p.id ? { ...x, is_active: !p.is_active } : x)));
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Промокоды</h1>
        <button
          onClick={() => setEditing(empty())}
          className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm rounded-md hover:bg-foreground/90"
        >
          <Plus className="w-4 h-4" /> Новый код
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Загрузка…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground italic">Промокодов пока нет.</p>
      ) : (
        <div className="grid gap-3">
          {rows.map((p) => (
            <div key={p.id} className="border border-border rounded-md p-4 flex items-center gap-4 bg-background">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <code className="font-mono font-semibold tracking-wider">{p.code}</code>
                  <span className="text-sm text-accent font-display">
                    {p.discount_type === "percent" ? `−${p.discount_value}%` : `−${p.discount_value} ₽`}
                  </span>
                  {p.expires_at && (
                    <span className="text-xs text-muted-foreground">до {new Date(p.expires_at).toLocaleDateString("ru-RU")}</span>
                  )}
                </div>
                {p.description && <p className="text-sm text-muted-foreground mt-1 truncate">{p.description}</p>}
              </div>
              <button onClick={() => toggle(p)} title={p.is_active ? "Скрыть" : "Показать"} className="p-2 text-muted-foreground hover:text-foreground">
                {p.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button onClick={() => setEditing(p)} className="text-sm underline-offset-4 hover:underline">
                Изменить
              </button>
              <button onClick={() => remove(p)} className="p-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-2xl">{editing.id ? "Изменить код" : "Новый промокод"}</h2>
              <button onClick={() => setEditing(null)} className="text-muted-foreground">✕</button>
            </div>

            <div className="p-6 grid gap-4">
              <div>
                <label className="text-xs tracking-luxe uppercase text-muted-foreground">Код</label>
                <input
                  className={fieldCls + " font-mono uppercase"}
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="DSOM10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs tracking-luxe uppercase text-muted-foreground">Тип</label>
                  <select
                    className={fieldCls}
                    value={editing.discount_type}
                    onChange={(e) => setEditing({ ...editing, discount_type: e.target.value as any })}
                  >
                    <option value="percent">Процент (%)</option>
                    <option value="amount">Сумма (₽)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs tracking-luxe uppercase text-muted-foreground">Скидка</label>
                  <input
                    type="number"
                    className={fieldCls}
                    value={editing.discount_value}
                    onChange={(e) => setEditing({ ...editing, discount_value: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs tracking-luxe uppercase text-muted-foreground">Описание (RU)</label>
                <input
                  className={fieldCls}
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Скидка 10% на первый заказ"
                />
              </div>
              <div>
                <label className="text-xs tracking-luxe uppercase text-muted-foreground">Описание (EN)</label>
                <input
                  className={fieldCls}
                  value={editing.description_en || ""}
                  onChange={(e) => setEditing({ ...editing, description_en: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs tracking-luxe uppercase text-muted-foreground">Действует до</label>
                  <input
                    type="date"
                    className={fieldCls}
                    value={editing.expires_at ? editing.expires_at.slice(0, 10) : ""}
                    onChange={(e) => setEditing({ ...editing, expires_at: e.target.value || null })}
                  />
                </div>
                <div>
                  <label className="text-xs tracking-luxe uppercase text-muted-foreground">Лимит использований</label>
                  <input
                    type="number"
                    className={fieldCls}
                    value={editing.usage_limit || ""}
                    onChange={(e) => setEditing({ ...editing, usage_limit: e.target.value ? Number(e.target.value) : null })}
                    placeholder="∞"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs tracking-luxe uppercase text-muted-foreground">Ссылка для применения (маркетплейс)</label>
                <input
                  className={fieldCls}
                  value={editing.marketplace_url || ""}
                  onChange={(e) => setEditing({ ...editing, marketplace_url: e.target.value })}
                  placeholder="https://wildberries.ru/..."
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  />
                  Активен
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.is_public}
                    onChange={(e) => setEditing({ ...editing, is_public: e.target.checked })}
                  />
                  Показывать на сайте
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm">Отмена</button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2 text-sm rounded-md hover:bg-foreground/90 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PromoCodesAdmin;
