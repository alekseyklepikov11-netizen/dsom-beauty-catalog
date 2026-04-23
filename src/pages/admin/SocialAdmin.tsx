import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { fieldCls } from "@/components/admin/I18nField";

interface Social { id?: string; platform: string; url: string; is_active: boolean; sort_order: number }

const SocialAdmin = () => {
  const [rows, setRows] = useState<Social[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("social_links").select("*").order("sort_order");
    setRows((data || []) as Social[]);
  };
  useEffect(() => { load(); }, []);

  const add = () => setRows((r) => [...r, { platform: "Instagram", url: "", is_active: true, sort_order: r.length }]);

  const remove = async (idx: number) => {
    const row = rows[idx];
    if (row.id) await supabase.from("social_links").delete().eq("id", row.id);
    setRows((r) => r.filter((_, i) => i !== idx));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const [i, r] of rows.entries()) {
        const payload = { platform: r.platform, url: r.url, is_active: r.is_active, sort_order: i };
        if (!payload.url) continue;
        if (r.id) {
          await supabase.from("social_links").update(payload).eq("id", r.id);
        } else {
          await supabase.from("social_links").insert(payload);
        }
      }
      toast.success("Сохранено"); load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— Подвал</p>
          <h1 className="font-display text-5xl">Соцсети</h1>
        </div>
        <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-6 py-2.5 text-[11px] tracking-luxe uppercase hover:bg-accent disabled:opacity-60">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Сохранить всё
        </button>
      </div>

      <div className="bg-background rounded-2xl border border-border p-5 space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3">
            <input value={r.platform} onChange={(e) => setRows((rs) => rs.map((x, idx) => idx === i ? { ...x, platform: e.target.value } : x))} placeholder="Instagram, VK, Telegram…" className={fieldCls + " w-44"} />
            <input value={r.url} onChange={(e) => setRows((rs) => rs.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))} placeholder="https://…" className={fieldCls + " flex-1"} />
            <button onClick={() => setRows((rs) => rs.map((x, idx) => idx === i ? { ...x, is_active: !x.is_active } : x))} className="p-2 rounded hover:bg-secondary">
              {r.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button onClick={() => remove(i)} className="p-2 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={add} className="inline-flex items-center gap-2 text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground pt-2">
          <Plus className="w-3.5 h-3.5" /> Добавить
        </button>
      </div>
    </AdminLayout>
  );
};

export default SocialAdmin;
