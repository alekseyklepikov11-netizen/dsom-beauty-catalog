import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  productId: string;
  productName: string;
}

const StockAlertDialog = ({ productId, productName }: Props) => {
  const { i18n } = useTranslation();
  const en = i18n.language === "en";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error(en ? "Invalid email" : "Неверный email");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("stock_alerts").insert({ product_id: productId, email });
    setBusy(false);
    if (error) {
      if (error.code === "23505") {
        toast.info(en ? "You're already subscribed" : "Вы уже подписаны");
        setOpen(false);
        return;
      }
      toast.error(error.message);
      return;
    }
    toast.success(en ? "We'll notify you when it's back" : "Мы напишем, когда товар появится");
    setEmail("");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 border border-foreground/20 hover:border-foreground py-3.5 text-[11px] tracking-luxe uppercase transition-colors"
      >
        <Bell className="w-3.5 h-3.5" />
        {en ? "Notify when available" : "Сообщить о поступлении"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-background w-full max-w-md p-8 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-2xl mb-2">
              {en ? "Notify me" : "Уведомить о наличии"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {en
                ? `We'll send a one-time email when "${productName}" is back in stock.`
                : `Пришлём одно письмо, когда «${productName}» снова появится в наличии.`}
            </p>
            <form onSubmit={submit} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border border-border bg-background px-4 py-3 text-sm focus:border-foreground outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-foreground text-background py-3.5 text-[11px] tracking-luxe uppercase hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "…" : en ? "Subscribe" : "Подписаться"}
              </button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-4 text-center">
              {en ? "We won't share your email with anyone." : "Email не передаём третьим лицам."}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default StockAlertDialog;
