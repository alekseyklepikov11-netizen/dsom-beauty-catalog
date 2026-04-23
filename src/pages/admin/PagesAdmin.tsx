import { useEffect, useState } from "react";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import I18nField, { Field, fieldCls } from "@/components/admin/I18nField";

interface Page {
  id?: string; slug: string;
  title: string; title_en: string | null;
  content: any; content_en: any;
  is_published: boolean;
}

const PagesAdmin = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("pages").select("*").order("slug");
    setPages((data || []) as Page[]);
    if (!active && data && data[0]) setActive(data[0].slug);
  };
  useEffect(() => { load(); }, []);

  const current = pages.find((p) => p.slug === active);

  const upd = (k: keyof Page, v: any) => {
    setPages((arr) => arr.map((p) => p.slug === active ? { ...p, [k]: v } : p));
  };

  const save = async () => {
    if (!current) return;
    setSaving(true);
    try {
      const payload: any = {
        slug: current.slug, title: current.title, title_en: current.title_en,
        content: current.content || {}, content_en: current.content_en || {},
        is_published: current.is_published,
      };
      if (current.id) {
        const { error } = await supabase.from("pages").update(payload).eq("id", current.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pages").insert(payload);
        if (error) throw error;
      }
      toast.success("Сохранено"); load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— CMS</p>
        <h1 className="font-display text-5xl">Страницы</h1>
        <p className="text-sm text-muted-foreground mt-3">Редактируйте текстовое содержимое страниц «О бренде», «Контакты» и других.</p>
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <aside className="bg-background border border-border rounded-2xl p-3 h-fit">
          <ul className="space-y-1">
            {pages.map((p) => (
              <li key={p.slug}>
                <button onClick={() => setActive(p.slug)} className={`w-full text-left px-3 py-2 rounded text-[11px] tracking-luxe uppercase transition-colors ${active === p.slug ? "bg-foreground text-background" : "hover:bg-secondary"}`}>
                  {p.slug}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {current ? (
          <div className="bg-background border border-border rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <Field label="Slug">
                <input value={current.slug} onChange={(e) => upd("slug", e.target.value)} className={fieldCls + " w-64"} />
              </Field>
              <button onClick={() => upd("is_published", !current.is_published)} className="inline-flex items-center gap-2 text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground">
                {current.is_published ? <><Eye className="w-3.5 h-3.5" />Опубликовано</> : <><EyeOff className="w-3.5 h-3.5" />Черновик</>}
              </button>
            </div>
            <I18nField label="Заголовок" valueRu={current.title} valueEn={current.title_en || ""}
              onChangeRu={(v) => upd("title", v)} onChangeEn={(v) => upd("title_en", v)} />
            <I18nField label="Содержимое (Markdown / текст)" textarea rows={14}
              valueRu={typeof current.content === "string" ? current.content : (current.content?.body || "")}
              valueEn={typeof current.content_en === "string" ? current.content_en : (current.content_en?.body || "")}
              onChangeRu={(v) => upd("content", { body: v })}
              onChangeEn={(v) => upd("content_en", { body: v })} />
            <div className="flex justify-end pt-2 border-t border-border">
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-6 py-2.5 text-[11px] tracking-luxe uppercase hover:bg-accent disabled:opacity-60">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Сохранить
              </button>
            </div>
          </div>
        ) : <p className="text-sm text-muted-foreground">Выберите страницу слева.</p>}
      </div>
    </AdminLayout>
  );
};

export default PagesAdmin;
