import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, Mail, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { ymGoal } from "@/lib/metrika";
import { LAUNCH_CONFIG, currentPhase } from "@/lib/launchConfig";

/**
 * Воронка промокода: Telegram-first + email-резерв.
 * Решение собрания 19.05.2026, Блок 1. Уточнение: 2 фазы (launch 10% / welcome 5%).
 */
const TG_BOT_URL = LAUNCH_CONFIG.telegramBotUrl;

interface Props {
  variant?: "inline" | "card";
  source: string;
}

const PromoGate = ({ variant = "card", source }: Props) => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [mode, setMode] = useState<"idle" | "email" | "submitted">("idle");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Текущая фаза: на старте 10%, далее welcome 5%
  const phase = currentPhase();
  const PROMO_CODE = phase === "launch" ? LAUNCH_CONFIG.launchCode : LAUNCH_CONFIG.welcomeCode;
  const DISCOUNT = phase === "launch" ? LAUNCH_CONFIG.launchDiscountPercent : LAUNCH_CONFIG.welcomeDiscountPercent;

  const handleTelegram = () => {
    track("promo_click", { value: `tg:${source}` });
    ymGoal("tg_redirect", { source });
    window.open(TG_BOT_URL, "_blank", "noopener,noreferrer");
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError(lang === "en" ? "Please accept terms" : "Подтвердите согласие");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(lang === "en" ? "Invalid email" : "Некорректный email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await supabase.from("newsletter_subscribers").upsert(
        { email: email.trim().toLowerCase(), source: `promo:${source}` },
        { onConflict: "email" }
      );
      // Триггер транзакционного письма
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          to: email,
          template: "promo_welcome",
          variables: { code: PROMO_CODE, discount: DISCOUNT, ozon_url: LAUNCH_CONFIG.ozonSellerUrl + `&utm_campaign=${PROMO_CODE.toLowerCase()}` },
        },
      }).catch(() => null); // если функция отсутствует — не фейлим UX, лид всё равно сохранён
      track("email_submit", { value: `promo:${source}` });
      ymGoal("email_submit", { source });
      setMode("submitted");
    } catch (err) {
      setError(lang === "en" ? "Something went wrong" : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "submitted") {
    return (
      <div className={variant === "card" ? "rounded-2xl border border-border bg-card p-6 text-center" : "text-sm text-muted-foreground"}>
        <Check className="w-6 h-6 mx-auto mb-3 text-accent" />
        <p className="font-display text-lg mb-1">
          {lang === "en" ? "Check your inbox" : "Промокод у вас на почте"}
        </p>
        <p className="text-sm text-muted-foreground">
          {lang === "en" ? `Promocode ${PROMO_CODE} sent.` : `Промокод ${PROMO_CODE} отправлен. Сработает на Ozon после старта продаж.`}
        </p>
      </div>
    );
  }

  if (mode === "email") {
    return (
      <form onSubmit={handleEmail} className={variant === "card" ? "rounded-2xl border border-border bg-card p-6" : "space-y-3"}>
        <p className="text-[10px] tracking-luxe uppercase text-accent mb-2">
          {lang === "en" ? "— Email" : "— На email"}
        </p>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={lang === "en" ? "your@email.com" : "ваш@email.ru"}
          className="w-full border border-border rounded-full px-5 py-3 text-sm bg-background focus:outline-none focus:border-foreground transition-colors"
          required autoFocus
        />
        <label className="flex items-start gap-2 mt-3 text-xs text-muted-foreground leading-relaxed">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
          <span>
            {lang === "en"
              ? "I agree to the processing of personal data and "
              : "Я согласен(на) на обработку персональных данных и "}
            <a href="/page/privacy" className="underline">{lang === "en" ? "privacy policy" : "политику конфиденциальности"}</a>
          </span>
        </label>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button
            type="submit" disabled={loading}
            className="flex-1 bg-foreground text-background rounded-full py-2.5 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === "en" ? "Get promocode" : "Получить промокод")}
          </button>
          <button
            type="button" onClick={() => setMode("idle")}
            className="px-5 border border-border rounded-full text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            {lang === "en" ? "Back" : "Назад"}
          </button>
        </div>
      </form>
    );
  }

  // idle — две кнопки
  return (
    <div className={variant === "card" ? "rounded-2xl border border-border bg-card p-6" : ""}>
      {variant === "card" && (
        <>
          <p className="text-[10px] tracking-luxe uppercase text-accent mb-2">— {lang === "en" ? (phase === "launch" ? "Launch offer" : "Welcome offer") : (phase === "launch" ? "Стартовая акция" : "Приветственная скидка")}</p>
          <p className="font-display text-xl mb-1">
            {lang === "en" ? `Get ${DISCOUNT}% off on Ozon` : `${DISCOUNT}% на первый заказ на Ozon`}
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            {lang === "en" ? "Choose where to receive it." : "Выберите, куда отправить промокод."}
          </p>
        </>
      )}
      <div className={variant === "card" ? "flex flex-col sm:flex-row gap-2" : "flex gap-2"}>
        <button
          onClick={handleTelegram}
          className="flex-1 bg-foreground text-background rounded-full py-3 px-5 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          {lang === "en" ? "Telegram" : "В Telegram"}
        </button>
        <button
          onClick={() => { setMode("email"); track("promo_click", { value: `email:${source}` }); }}
          className="flex-1 border border-border rounded-full py-3 px-5 text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" />
          {lang === "en" ? "Email" : "На email"}
        </button>
      </div>
    </div>
  );
};

export default PromoGate;
