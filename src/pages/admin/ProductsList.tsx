import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, EyeOff, Search, Pencil, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";

interface Row {
  id: string; slug: string; name: string; price: number; volume: string | null;
  cover_image_url: string | null; is_visible: boolean; is_bestseller: boolean; is_new: boolean;
  brand_id: string | null; category_id: string | null;
}

const ProductsList = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products")
      .select("id,slug,name,price,volume,cover_image_url,is_visible,is_bestseller,is_new,brand_id,category_id")
      .order("sort_order").order("created_at", { ascending: false });
    setRows((data || []) as Row[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleVisible = async (r: Row) => {
    const { error } = await supabase.from("products").update({ is_visible: !r.is_visible }).eq("id", r.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, is_visible: !x.is_visible } : x));
  };

  const remove = async (r: Row) => {
    if (!confirm(`Удалить «${r.name}»?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((x) => x.id !== r.id));
    toast.success("Удалено");
  };

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.slug.includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— Каталог</p>
          <h1 className="font-display text-5xl">Товары</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/products/import" className="inline-flex items-center gap-2 border border-border rounded-full px-4 py-2 text-[11px] tracking-luxe uppercase hover:border-foreground transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>CSV</span>
          </Link>
          <Link to="/admin/products/new" className="inline-flex items-center gap-2 bg-foreground text-background rounded-full pl-5 pr-2 py-2 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors">
            <span>Новый товар</span>
            <span className="grid place-items-center w-7 h-7 rounded-full bg-background/15"><Plus className="w-3.5 h-3.5" /></span>
          </Link>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию или slug…"
          className="w-full bg-background border border-border rounded-md pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
        />
      </div>

      <div className="bg-background rounded-2xl overflow-hidden border border-border">
        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Загрузка…</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground italic">Ничего не найдено</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((r) => (
              <li key={r.id} className="flex items-center gap-4 p-3 hover:bg-secondary/50 transition-colors">
                <div className="w-14 h-14 bg-secondary rounded overflow-hidden shrink-0">
                  {r.cover_image_url && <img src={r.cover_image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg truncate">{r.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] tracking-luxe uppercase text-muted-foreground">
                    <span>{r.slug}</span>
                    {r.is_bestseller && <span className="text-accent">· Бестселлер</span>}
                    {r.is_new && <span className="text-accent">· Новинка</span>}
                  </div>
                </div>
                <p className="font-display text-lg shrink-0">{Number(r.price).toLocaleString("ru-RU")} ₽</p>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleVisible(r)} title={r.is_visible ? "Скрыть" : "Показать"} className="p-2 rounded hover:bg-secondary">
                    {r.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <Link to={`/admin/products/${r.id}`} title="Редактировать" className="p-2 rounded hover:bg-secondary">
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button onClick={() => remove(r)} title="Удалить" className="p-2 rounded hover:bg-destructive/10 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
};

export default ProductsList;
