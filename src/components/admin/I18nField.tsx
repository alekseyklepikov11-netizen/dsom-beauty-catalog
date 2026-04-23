import { ReactNode } from "react";

interface Props {
  label: string;
  valueRu: string;
  valueEn: string;
  onChangeRu: (v: string) => void;
  onChangeEn: (v: string) => void;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
}

const I18nField = ({ label, valueRu, valueEn, onChangeRu, onChangeEn, textarea, rows = 3, placeholder }: Props) => {
  const baseCls = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-foreground transition";
  return (
    <div>
      <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">{label}</label>
      <div className="grid md:grid-cols-2 gap-3 mt-1.5">
        <div>
          <p className="text-[9px] tracking-luxe uppercase text-muted-foreground/60 mb-1">RU</p>
          {textarea ? (
            <textarea value={valueRu} onChange={(e) => onChangeRu(e.target.value)} rows={rows} placeholder={placeholder} className={baseCls + " resize-y"} />
          ) : (
            <input value={valueRu} onChange={(e) => onChangeRu(e.target.value)} placeholder={placeholder} className={baseCls} />
          )}
        </div>
        <div>
          <p className="text-[9px] tracking-luxe uppercase text-muted-foreground/60 mb-1">EN</p>
          {textarea ? (
            <textarea value={valueEn} onChange={(e) => onChangeEn(e.target.value)} rows={rows} placeholder={placeholder} className={baseCls + " resize-y"} />
          ) : (
            <input value={valueEn} onChange={(e) => onChangeEn(e.target.value)} placeholder={placeholder} className={baseCls} />
          )}
        </div>
      </div>
    </div>
  );
};

export default I18nField;

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">{label}</label>
    <div className="mt-1.5">{children}</div>
  </div>
);

export const fieldCls = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-foreground transition";
