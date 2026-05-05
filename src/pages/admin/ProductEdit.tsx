import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import I18nField, { Field, fieldCls } from "@/components/admin/I18nField";
import ImageUpload from "@/components/admin/ImageUpload";
import { SKIN_TYPES } from "@/lib/skinTypes";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableImage = ({
  id,
  url,
  onChange,
}: {
  id: string;
  url: string;
  onChange: (url: string | null) => void;
}) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto" as const,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative touch-none">
      <ImageUpload bucket="product-images" value={url} onChange={onChange} label="" aspect="aspect-square" />
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        title="Перетащить"
        className="absolute top-1 left-1 z-10 grid place-items-center w-7 h-7 rounded bg-background/80 backdrop-blur border border-border text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

interface Brand { id: string; name: string }
interface Cat { id: string; name: string; parent_id: string | null }
interface MLink { id?: string; kind: string; url: string; label: string | null }
interface Img { id?: string; url: string; sort_order: number }

const KINDS: { value: string; label: string }[] = [
  { value: "wildberries", label: "Wildberries" },
  { value: "ozon", label: "Ozon" },
  { value: "yandex_market", label: "Яндекс Маркет" },
  { value: "goldapple", label: "Золотое Яблоко" },
  { value: "other", label: "Другое" },
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9а-яё ]/gi, "").replace(/\s+/g, "-").slice(0, 60);

const ProductEdit = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);

  const [form, setForm] = useState({
    slug: "", name: "", name_en: "",
    subtitle: "", subtitle_en: "",
    description: "", description_en: "",
    ingredients: "", ingredients_en: "",
    how_to_use: "", how_to_use_en: "",
    price: 0, volume: "",
    brand_id: "" as string, category_id: "" as string,
    cover_image_url: null as string | null,
    is_visible: true, is_bestseller: false, is_new: false,
    sort_order: 0,
    skin_types: [] as string[],
  });
  const [links, setLinks] = useState<MLink[]>([]);
  const [images, setImages] = useState<Img[]>([]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    (async () => {
      const [b, c] = await Promise.all([
        supabase.from("brands").select("id,name").order("sort_order"),
        supabase.from("categories").select("id,name,parent_id").order("sort_order"),
      ]);
      setBrands((b.data || []) as Brand[]);
      setCats((c.data || []) as Cat[]);

      if (!isNew) {
        const { data: p } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
        if (p) {
          setForm({
            slug: p.slug, name: p.name, name_en: p.name_en || "",
            subtitle: p.subtitle || "", subtitle_en: p.subtitle_en || "",
            description: p.description || "", description_en: p.description_en || "",
            ingredients: p.ingredients || "", ingredients_en: p.ingredients_en || "",
            how_to_use: p.how_to_use || "", how_to_use_en: p.how_to_use_en || "",
            price: Number(p.price), volume: p.volume || "",
            brand_id: p.brand_id || "", category_id: p.category_id || "",
            cover_image_url: p.cover_image_url,
            is_visible: p.is_visible, is_bestseller: p.is_bestseller, is_new: p.is_new,
            sort_order: p.sort_order,
            skin_types: (p as any).skin_types || [],
          });
          const [l, im] = await Promise.all([
            supabase.from("marketplace_links").select("id,kind,url,label").eq("product_id", id),
            supabase.from("product_images").select("id,url,sort_order").eq("product_id", id).order("sort_order"),
          ]);
          setLinks((l.data || []) as MLink[]);
          setImages((im.data || []) as Img[]);
        }
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const upd = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.slug) return toast.error("Название и slug обязательны");
    setSaving(true);
    try {
      const payload = {
        slug: form.slug, name: form.name, name_en: form.name_en || null,
        subtitle: form.subtitle || null, subtitle_en: form.subtitle_en || null,
        description: form.description || null, description_en: form.description_en || null,
        ingredients: form.ingredients || null, ingredients_en: form.ingredients_en || null,
        how_to_use: form.how_to_use || null, how_to_use_en: form.how_to_use_en || null,
        price: Number(form.price) || 0, volume: form.volume || null,
        brand_id: form.brand_id || null, category_id: form.category_id || null,
        cover_image_url: form.cover_image_url,
        is_visible: form.is_visible, is_bestseller: form.is_bestseller, is_new: form.is_new,
        sort_order: form.sort_order,
        skin_types: form.skin_types,
      };

      let pid = id as string;
      if (isNew) {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        pid = data.id;
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", pid);
        if (error) throw error;
      }

      // Replace marketplace links
      await supabase.from("marketplace_links").delete().eq("product_id", pid);
      const validLinks = links.filter((l) => l.url && l.kind);
      if (validLinks.length) {
        await supabase.from("marketplace_links").insert(
          validLinks.map((l) => ({ product_id: pid, kind: l.kind as any, url: l.url, label: l.label || null }))
        );
      }

      // Replace gallery images
      await supabase.from("product_images").delete().eq("product_id", pid);
      const validImages = images.filter((i) => i.url);
      if (validImages.length) {
        await supabase.from("product_images").insert(
          validImages.map((i, idx) => ({ product_id: pid, url: i.url, sort_order: idx }))
        );
      }

      toast.success("Сохранено");
      navigate("/admin/products");
    } catch (err: any) {
      toast.error(err.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Загрузка…</div></AdminLayout>;

  return (
    <AdminLayout>
      <Link to="/admin/products" className="inline-flex items-center gap-2 text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Все товары
      </Link>
      <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
        <h1 className="font-display text-5xl">{isNew ? "Новый товар" : form.name}</h1>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-6 py-2.5 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors disabled:opacity-60">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Сохранить
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 bg-background p-6 md:p-8 rounded-2xl border border-border">
          <I18nField label="Название" valueRu={form.name} valueEn={form.name_en} onChangeRu={(v) => { upd("name", v); if (isNew && !form.slug) upd("slug", slugify(v)); }} onChangeEn={(v) => upd("name_en", v)} />
          <I18nField label="Подзаголовок" valueRu={form.subtitle} valueEn={form.subtitle_en} onChangeRu={(v) => upd("subtitle", v)} onChangeEn={(v) => upd("subtitle_en", v)} />
          <I18nField label="Описание" textarea rows={4} valueRu={form.description} valueEn={form.description_en} onChangeRu={(v) => upd("description", v)} onChangeEn={(v) => upd("description_en", v)} />
          <I18nField label="Состав" textarea rows={3} valueRu={form.ingredients} valueEn={form.ingredients_en} onChangeRu={(v) => upd("ingredients", v)} onChangeEn={(v) => upd("ingredients_en", v)} />
          <I18nField label="Применение" textarea rows={3} valueRu={form.how_to_use} valueEn={form.how_to_use_en} onChangeRu={(v) => upd("how_to_use", v)} onChangeEn={(v) => upd("how_to_use_en", v)} />

          <div>
            <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-3">Маркетплейсы (WB / Ozon / …)</p>
            <div className="space-y-2">
              {links.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <select value={l.kind} onChange={(e) => setLinks((ls) => ls.map((x, idx) => idx === i ? { ...x, kind: e.target.value } : x))} className={fieldCls + " w-44"}>
                    {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                  <input value={l.url} onChange={(e) => setLinks((ls) => ls.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))} placeholder="https://…" className={fieldCls + " flex-1"} />
                  <button onClick={() => setLinks((ls) => ls.filter((_, idx) => idx !== i))} className="p-2 rounded hover:bg-destructive/10 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={() => setLinks((ls) => [...ls, { kind: "wildberries", url: "", label: null }])} className="inline-flex items-center gap-2 text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground">
                <Plus className="w-3.5 h-3.5" /> Добавить ссылку
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-3">Дополнительные фото (галерея) — зажмите ручку, чтобы переставить</p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e: DragEndEvent) => {
                const { active, over } = e;
                if (!over || active.id === over.id) return;
                setImages((arr) => {
                  const ids = arr.map((x, idx) => x.id || `tmp-${idx}`);
                  const oldIndex = ids.indexOf(String(active.id));
                  const newIndex = ids.indexOf(String(over.id));
                  if (oldIndex < 0 || newIndex < 0) return arr;
                  return arrayMove(arr, oldIndex, newIndex);
                });
              }}
            >
              <SortableContext items={images.map((x, idx) => x.id || `tmp-${idx}`)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {images.map((im, i) => (
                    <SortableImage
                      key={im.id || `tmp-${i}`}
                      id={im.id || `tmp-${i}`}
                      url={im.url}
                      onChange={(url) => {
                        if (!url) setImages((arr) => arr.filter((_, idx) => idx !== i));
                        else setImages((arr) => arr.map((x, idx) => idx === i ? { ...x, url } : x));
                      }}
                    />
                  ))}
                  <button onClick={() => setImages((arr) => [...arr, { url: "", sort_order: arr.length }])} className="aspect-square border border-dashed border-border rounded-md grid place-items-center text-[10px] tracking-luxe uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-background p-6 rounded-2xl border border-border">
            <ImageUpload bucket="product-images" value={form.cover_image_url} onChange={(url) => upd("cover_image_url", url)} label="Обложка" />
          </div>

          <div className="bg-background p-6 rounded-2xl border border-border space-y-5">
            <Field label="Slug (URL)">
              <input value={form.slug} onChange={(e) => upd("slug", slugify(e.target.value))} className={fieldCls} />
            </Field>
            <Field label="Цена, ₽">
              <input type="number" value={form.price} onChange={(e) => upd("price", e.target.value)} className={fieldCls} />
            </Field>
            <Field label="Объём">
              <input value={form.volume} onChange={(e) => upd("volume", e.target.value)} placeholder="50 мл" className={fieldCls} />
            </Field>
            <Field label="Бренд">
              <select value={form.brand_id} onChange={(e) => upd("brand_id", e.target.value)} className={fieldCls}>
                <option value="">—</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Категория">
              <select value={form.category_id} onChange={(e) => upd("category_id", e.target.value)} className={fieldCls}>
                <option value="">—</option>
                {cats.filter((c) => !c.parent_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Порядок сортировки">
              <input type="number" value={form.sort_order} onChange={(e) => upd("sort_order", Number(e.target.value))} className={fieldCls} />
            </Field>

            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-2">Тип кожи</p>
              {SKIN_TYPES.map((s) => (
                <label key={s.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.skin_types.includes(s.value)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.skin_types, s.value]
                        : form.skin_types.filter((x) => x !== s.value);
                      upd("skin_types", next);
                    }}
                  />
                  {s.ru}
                </label>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_visible} onChange={(e) => upd("is_visible", e.target.checked)} />
                Видим на сайте
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_bestseller} onChange={(e) => upd("is_bestseller", e.target.checked)} />
                Бестселлер
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_new} onChange={(e) => upd("is_new", e.target.checked)} />
                Новинка
              </label>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductEdit;
