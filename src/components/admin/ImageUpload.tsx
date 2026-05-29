import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SrcsetVariant {
  width: number;
  key: string;
}

const DEFAULT_VARIANTS: SrcsetVariant[] = [
  { width: 768,  key: "768w"  },
  { width: 1280, key: "1280w" },
  { width: 1920, key: "1920w" },
];

interface Props {
  bucket: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /**
   * Optional callback. Если передан — компонент сгенерирует адаптивные
   * WebP-варианты (по variants) и вернёт map ТОЛЬКО для своих ключей.
   * BannersAdmin должен МЁРЖИТЬ это с существующим image_srcset
   * (через функциональный setState с spread), чтобы desktop и mobile
   * загрузки не затирали друг друга.
   */
  onSrcsetChange?: (srcset: Record<string, string> | null) => void;
  /**
   * Кастомные размеры/ключи. По умолчанию — desktop (768w/1280w/1920w).
   * Для mobile 4:5 передавать: [{480, "mobile_480w"}, {768, "mobile_768w"}, {1080, "mobile_1080w"}].
   */
  variants?: SrcsetVariant[];
  /**
   * primaryKey — какой ключ из variants использовать для onChange (image_url).
   * По умолчанию последний (самый большой). Для mobile можно не передавать main_url —
   * передать primaryKey: null чтобы onChange был no-op.
   */
  primaryKey?: string | null;
  label?: string;
  className?: string;
  aspect?: string;
}

/** Загружает <img> из File через ObjectURL. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/**
 * Конвертирует исходное HTMLImageElement в WebP-blob заданной ширины.
 * Если оригинал уже ≤ maxWidth — резайз не делается (lossless по размеру).
 * Используется imageSmoothingQuality='high' для качественного даунсэмплинга.
 */
async function toWebp(img: HTMLImageElement, maxWidth: number, quality = 0.92): Promise<Blob> {
  const scale = img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("WebP encoding failed")),
      "image/webp",
      quality,
    );
  });
}

const ImageUpload = ({ bucket, value, onChange, onSrcsetChange, variants, primaryKey, label = "Изображение", className = "", aspect = "aspect-[4/5]" }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const effectiveVariants = variants && variants.length > 0 ? variants : DEFAULT_VARIANTS;
  // primaryKey === null означает «не трогать image_url». undefined → last variant.
  const effectivePrimaryKey = primaryKey === null
    ? null
    : (primaryKey || effectiveVariants[effectiveVariants.length - 1].key);

  const upload = async (file: File) => {
    setUploading(true);
    setProgress("");
    try {
      const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Режим adaptive — параметр onSrcsetChange подсказывает, что мы baner-загружаем
      // и хотим srcset с N размерами WebP. По умолчанию (без callback) — старое
      // поведение: единственный файл в исходном формате.
      if (onSrcsetChange) {
        setProgress("Декодирование...");
        const img = await loadImage(file);
        const srcset: Record<string, string> = {};

        for (let i = 0; i < effectiveVariants.length; i++) {
          const v = effectiveVariants[i];
          setProgress(`WebP ${v.width}w (${i + 1}/${effectiveVariants.length})...`);
          const blob = await toWebp(img, v.width, 0.92);
          const path = `${slug}-${v.width}.webp`;
          const { error } = await supabase.storage.from(bucket).upload(path, blob, {
            contentType: "image/webp",
            cacheControl: "31536000", // 1 год — у нас уникальное имя файла
            upsert: false,
          });
          if (error) throw error;
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          srcset[v.key] = data.publicUrl;
        }

        // Главный image_url — primaryKey (по умолчанию последний = максимальный).
        // Для mobile-загрузки primaryKey === null → image_url не трогаем.
        if (effectivePrimaryKey) {
          onChange(srcset[effectivePrimaryKey]);
        }
        onSrcsetChange(srcset);
        toast.success(`Загружено в WebP × ${effectiveVariants.length} (адаптивно): ~${Math.round(file.size / 1024 / 10) / 100}× меньше`);
      } else {
        // Legacy режим — без оптимизации
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${slug}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600", upsert: false,
        });
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        onChange(data.publicUrl);
        toast.success("Загружено");
      }
    } catch (err: any) {
      toast.error(err.message || "Не удалось загрузить");
      console.error("ImageUpload error:", err);
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <div className={className}>
      {label && <p className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-1.5">{label}</p>}
      <div className={`relative ${aspect} bg-secondary rounded-md overflow-hidden border border-border group`}>
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // Убираем image_url только если primaryKey задан (desktop mode)
                if (effectivePrimaryKey) onChange(null);
                // Передаём пустой объект с только своими ключами (BannersAdmin будет мёржить,
                // а наличие ключа со значением "" = сигнал на удаление этого ключа)
                if (onSrcsetChange) {
                  const cleared: Record<string, string> = {};
                  effectiveVariants.forEach(v => { cleared[v.key] = ""; });
                  onSrcsetChange(cleared);
                }
              }}
              className="absolute top-2 right-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background hover:bg-destructive text-[10px] tracking-luxe uppercase shadow-lg font-medium z-10"
              aria-label="Убрать изображение"
              title="Убрать картинку — потом можно загрузить новую"
            >
              <X className="w-3 h-3" />
              Убрать
            </button>
          </>
        ) : (
          <button
            type="button" onClick={() => inputRef.current?.click()}
            className="absolute inset-0 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {uploading ? (
              <div className="text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                {progress && <p className="text-[10px] tracking-luxe uppercase mt-2">{progress}</p>}
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-5 h-5 mx-auto mb-2" />
                <p className="text-[10px] tracking-luxe uppercase">Загрузить</p>
                {onSrcsetChange && <p className="text-[9px] text-muted-foreground mt-1">авто WebP ×3</p>}
              </div>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />
    </div>
  );
};

export default ImageUpload;
