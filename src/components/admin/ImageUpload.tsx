import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  bucket: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
  aspect?: string;
}

const ImageUpload = ({ bucket, value, onChange, label = "Изображение", className = "", aspect = "aspect-[4/5]" }: Props) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600", upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Загружено");
    } catch (err: any) {
      toast.error(err.message || "Не удалось загрузить");
    } finally {
      setUploading(false);
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
              type="button" onClick={() => onChange(null)}
              className="absolute top-2 right-2 w-7 h-7 grid place-items-center rounded-full bg-background/90 hover:bg-background"
              aria-label="Удалить"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button" onClick={() => inputRef.current?.click()}
            className="absolute inset-0 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <div className="text-center">
                <Upload className="w-5 h-5 mx-auto mb-2" />
                <p className="text-[10px] tracking-luxe uppercase">Загрузить</p>
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
