import { useState, useRef } from "react";
import { Download, Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Link } from "react-router-dom";

interface CsvRow {
  [k: string]: string;
}

interface ImportResult {
  inserted: number;
  updated: number;
  errors: { row: number; message: string }[];
}

const COLUMNS = [
  "slug", "name", "name_en", "subtitle", "subtitle_en",
  "description", "description_en", "ingredients", "ingredients_en",
  "how_to_use", "how_to_use_en", "price", "volume", "cover_image_url",
  "video_url", "is_visible", "is_bestseller", "is_new", "sort_order",
  "brand_slug", "category_slug", "tags",
];

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQ = false;
      } else cell += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") { cur.push(cell); cell = ""; }
      else if (ch === "\n") { cur.push(cell); rows.push(cur); cur = []; cell = ""; }
      else if (ch === "\r") { /* skip */ }
      else cell += ch;
    }
  }
  if (cell.length > 0 || cur.length > 0) { cur.push(cell); rows.push(cur); }
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((c) => c.trim() !== "")).map((r) => {
    const obj: CsvRow = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
    return obj;
  });
}

const parseBool = (v: string): boolean => ["1", "true", "yes", "да", "истина"].includes(v.toLowerCase().trim());
const parseNum = (v: string, d = 0): number => {
  if (!v) return d;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : d;
};

const ProductsImport = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleExport = async () => {
    const { data: products } = await supabase.from("products")
      .select("*, brands(slug), categories!products_category_id_fkey(slug)")
      .order("created_at", { ascending: false });
    if (!products) return toast.error("Не удалось загрузить товары");

    const lines = [COLUMNS.join(",")];
    for (const p of products as any[]) {
      const row = COLUMNS.map((col) => {
        if (col === "brand_slug") return csvEscape(p.brands?.slug || "");
        if (col === "category_slug") return csvEscape(p.categories?.slug || "");
        if (col === "tags") return csvEscape((p.tags || []).join("|"));
        return csvEscape(p[col]);
      });
      lines.push(row.join(","));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dsom-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Экспортировано: ${products.length} товаров`);
  };

  const handleTemplate = () => {
    const sample = [
      COLUMNS.join(","),
      [
        "essence-radiance", "Essence Radiance", "Essence Radiance",
        "Сияющий тоник", "Radiance toner",
        "Питательный тоник для лица.", "Nourishing facial toner.",
        "Aqua, Glycerin", "Aqua, Glycerin",
        "Нанести на чистую кожу.", "Apply to cleansed skin.",
        "3990", "100ml", "https://example.com/cover.jpg",
        "", "true", "false", "true", "0",
        "missha", "uhod-za-licom", "увлажнение|сияние",
      ].map(csvEscape).join(","),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dsom-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setResult(null);
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      toast.error("Файл пустой или некорректный");
      setImporting(false);
      return;
    }

    // Preload brands and categories slug → id
    const [{ data: brands }, { data: cats }] = await Promise.all([
      supabase.from("brands").select("id,slug"),
      supabase.from("categories").select("id,slug"),
    ]);
    const brandMap = new Map((brands || []).map((b: any) => [b.slug, b.id]));
    const catMap = new Map((cats || []).map((c: any) => [c.slug, c.id]));

    const errors: { row: number; message: string }[] = [];
    let inserted = 0, updated = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2; // +1 for header, +1 for 1-indexing
      try {
        if (!r.slug) { errors.push({ row: rowNum, message: "Пустой slug" }); continue; }
        if (!r.name) { errors.push({ row: rowNum, message: "Пустое name" }); continue; }

        const brandId = r.brand_slug ? brandMap.get(r.brand_slug) || null : null;
        const catId = r.category_slug ? catMap.get(r.category_slug) || null : null;
        if (r.brand_slug && !brandId) { errors.push({ row: rowNum, message: `Бренд "${r.brand_slug}" не найден` }); continue; }
        if (r.category_slug && !catId) { errors.push({ row: rowNum, message: `Категория "${r.category_slug}" не найдена` }); continue; }

        const payload = {
          slug: r.slug,
          name: r.name,
          name_en: r.name_en || null,
          subtitle: r.subtitle || null,
          subtitle_en: r.subtitle_en || null,
          description: r.description || null,
          description_en: r.description_en || null,
          ingredients: r.ingredients || null,
          ingredients_en: r.ingredients_en || null,
          how_to_use: r.how_to_use || null,
          how_to_use_en: r.how_to_use_en || null,
          price: parseNum(r.price, 0),
          volume: r.volume || null,
          cover_image_url: r.cover_image_url || null,
          video_url: r.video_url || null,
          is_visible: parseBool(r.is_visible || "true"),
          is_bestseller: parseBool(r.is_bestseller),
          is_new: parseBool(r.is_new),
          sort_order: parseNum(r.sort_order, 0),
          brand_id: brandId,
          category_id: catId,
          tags: r.tags ? r.tags.split("|").map((t) => t.trim()).filter(Boolean) : [],
        };

        const { data: existing } = await supabase.from("products").select("id").eq("slug", r.slug).maybeSingle();
        if (existing) {
          const { error } = await supabase.from("products").update(payload).eq("id", existing.id);
          if (error) errors.push({ row: rowNum, message: error.message });
          else updated++;
        } else {
          const { error } = await supabase.from("products").insert(payload);
          if (error) errors.push({ row: rowNum, message: error.message });
          else inserted++;
        }
      } catch (e: any) {
        errors.push({ row: rowNum, message: e.message || "Неизвестная ошибка" });
      }
    }

    setResult({ inserted, updated, errors });
    setImporting(false);
    if (errors.length === 0) toast.success(`Готово: добавлено ${inserted}, обновлено ${updated}`);
    else toast.warning(`Импорт завершён с ошибками: ${errors.length}`);
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <Link to="/admin/products" className="text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground">← К товарам</Link>
        <p className="text-[11px] tracking-luxe uppercase text-accent mb-3 mt-3">— CSV</p>
        <h1 className="font-display text-5xl">Импорт / экспорт</h1>
        <p className="text-sm text-muted-foreground mt-3">Массовое управление товарами через CSV. Колонка <code className="px-1 bg-secondary rounded">slug</code> определяет уникальность — при совпадении товар обновляется, иначе создаётся новый.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Export */}
        <div className="bg-background rounded-2xl p-7">
          <Download className="w-5 h-5 text-accent mb-4" />
          <h2 className="font-display text-2xl mb-2">Экспорт</h2>
          <p className="text-sm text-muted-foreground mb-5">Скачать все товары одним CSV-файлом. Удобно для бэкапа или редактирования в Excel/Google Sheets.</p>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-5 py-2.5 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Скачать CSV
          </button>
        </div>

        {/* Import */}
        <div className="bg-background rounded-2xl p-7">
          <Upload className="w-5 h-5 text-accent mb-4" />
          <h2 className="font-display text-2xl mb-2">Импорт</h2>
          <p className="text-sm text-muted-foreground mb-5">Загрузить CSV-файл. Файл должен содержать заголовки колонок (см. шаблон ниже).</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-5 py-2.5 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {importing ? "Импорт…" : "Выбрать файл"}
            </button>
            <button
              onClick={handleTemplate}
              className="inline-flex items-center gap-2 border border-border rounded-full px-5 py-2.5 text-[11px] tracking-luxe uppercase hover:border-foreground transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Скачать шаблон
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-background rounded-2xl p-7 mb-8">
          <h2 className="font-display text-2xl mb-5">Результат импорта</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-secondary rounded-xl p-5">
              <CheckCircle2 className="w-5 h-5 text-accent mb-3" />
              <p className="font-display text-3xl">{result.inserted}</p>
              <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mt-1">Добавлено</p>
            </div>
            <div className="bg-secondary rounded-xl p-5">
              <CheckCircle2 className="w-5 h-5 text-foreground mb-3" />
              <p className="font-display text-3xl">{result.updated}</p>
              <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mt-1">Обновлено</p>
            </div>
            <div className="bg-secondary rounded-xl p-5">
              <AlertCircle className={`w-5 h-5 mb-3 ${result.errors.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              <p className="font-display text-3xl">{result.errors.length}</p>
              <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mt-1">Ошибок</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="border border-destructive/30 rounded-xl p-4 max-h-60 overflow-y-auto">
              <ul className="space-y-2 text-xs">
                {result.errors.map((e, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-muted-foreground shrink-0">Строка {e.row}:</span>
                    <span className="text-destructive">{e.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Columns reference */}
      <div className="bg-background rounded-2xl p-7">
        <h2 className="font-display text-2xl mb-2">Формат CSV</h2>
        <p className="text-sm text-muted-foreground mb-5">Кодировка UTF-8, разделитель запятая, текст в кавычках если содержит запятую.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs">
          {COLUMNS.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <code className="bg-secondary rounded px-2 py-0.5 font-mono">{c}</code>
              {(c === "slug" || c === "name") && <span className="text-destructive text-[10px]">обязательно</span>}
            </div>
          ))}
        </div>
        <div className="mt-5 text-xs text-muted-foreground space-y-1">
          <p>• <code className="px-1 bg-secondary rounded">brand_slug</code> и <code className="px-1 bg-secondary rounded">category_slug</code> — slug бренда/категории (должны существовать в БД)</p>
          <p>• <code className="px-1 bg-secondary rounded">tags</code> — теги через символ <code className="px-1 bg-secondary rounded">|</code> (пример: <code>увлажнение|сияние</code>)</p>
          <p>• Булевы: <code className="px-1 bg-secondary rounded">true</code> / <code className="px-1 bg-secondary rounded">false</code> (или <code>да/нет</code>, <code>1/0</code>)</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductsImport;
