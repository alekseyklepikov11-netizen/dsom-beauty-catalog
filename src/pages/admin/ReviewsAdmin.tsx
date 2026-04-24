import { useEffect, useState } from "react";
import { Check, X, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import StarRating from "@/components/StarRating";

interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  created_at: string;
  product?: { name: string; slug: string } | null;
}

type Filter = "pending" | "approved" | "rejected" | "all";

const ReviewsAdmin = () => {
  const [rows, setRows] = useState<Review[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("reviews")
      .select("id,product_id,user_id,guest_name,guest_email,rating,title,body,status,created_at, product:products(name,slug)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data || []) as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const setStatus = async (r: Review, status: "approved" | "rejected") => {
    setBusy(r.id);
    const { error } = await supabase.from("reviews").update({ status }).eq("id", r.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Опубликовано" : "Отклонено");
    load();
  };

  const remove = async (r: Review) => {
    if (!confirm("Удалить отзыв?")) return;
    setBusy(r.id);
    const { error } = await supabase.from("reviews").delete().eq("id", r.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    load();
  };

  const tabs: { v: Filter; label: string }[] = [
    { v: "pending", label: "На модерации" },
    { v: "approved", label: "Опубликованные" },
    { v: "rejected", label: "Отклонённые" },
    { v: "all", label: "Все" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— Модерация</p>
        <h1 className="font-display text-5xl">Отзывы</h1>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.v}
            onClick={() => setFilter(t.v)}
            className={`px-4 py-2.5 text-[11px] tracking-luxe uppercase border-b-2 -mb-px whitespace-nowrap transition-colors ${
              filter === t.v
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground italic font-display text-2xl py-16 text-center">
          Нет отзывов
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="bg-background border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StarRating value={r.rating} readOnly size={14} />
                    <span
                      className={`text-[10px] tracking-luxe uppercase px-2 py-0.5 rounded ${
                        r.status === "approved"
                          ? "bg-accent/10 text-accent"
                          : r.status === "rejected"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {r.status === "approved" ? "Опубликован" : r.status === "rejected" ? "Отклонён" : "На модерации"}
                    </span>
                    {!r.user_id && (
                      <span className="text-[10px] tracking-luxe uppercase text-muted-foreground">Гость</span>
                    )}
                  </div>
                  {r.title && <h3 className="font-display text-xl mt-2">{r.title}</h3>}
                  <p className="text-sm leading-relaxed text-muted-foreground mt-2 whitespace-pre-line">
                    {r.body}
                  </p>
                  <div className="text-[11px] tracking-luxe uppercase text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    <span>— {r.guest_name || "Зарегистрированный"}</span>
                    {r.guest_email && <span>{r.guest_email}</span>}
                    {r.product?.slug && (
                      <a
                        href={`/product/${r.product.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-accent"
                      >
                        Товар: {r.product.name}
                      </a>
                    )}
                    <span>{new Date(r.created_at).toLocaleString("ru-RU")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.status !== "approved" && (
                    <button
                      onClick={() => setStatus(r, "approved")}
                      disabled={busy === r.id}
                      className="inline-flex items-center gap-1 bg-foreground text-background rounded-full px-3 py-1.5 text-[10px] tracking-luxe uppercase hover:bg-accent disabled:opacity-60"
                    >
                      {busy === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Одобрить
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      onClick={() => setStatus(r, "rejected")}
                      disabled={busy === r.id}
                      className="inline-flex items-center gap-1 border border-border rounded-full px-3 py-1.5 text-[10px] tracking-luxe uppercase hover:bg-secondary disabled:opacity-60"
                    >
                      <X className="w-3 h-3" />
                      Отклонить
                    </button>
                  )}
                  <button
                    onClick={() => remove(r)}
                    disabled={busy === r.id}
                    className="text-destructive p-1.5 hover:bg-destructive/10 rounded-full"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default ReviewsAdmin;
