import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Mail } from "lucide-react";
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
  const navigate = useNavigate();
  const lang = i18n.language;

  const phase = currentPhase();
  const DISCOUNT = phase === "launch" ? LAUNCH_CONFIG.launchDiscountPercent : LAUNCH_CONFIG.welcomeDiscountPercent;

  const handleTelegram = () => {
    track("promo_click", { value: `tg:${source}` });
    ymGoal("tg_redirect", { source });
    window.open(TG_BOT_URL, "_blank", "noopener,noreferrer");
  };

  const handleEmail = () => {
    track("promo_click", { value: `email:${source}` });
    ymGoal("email_redirect", { source });
    navigate(`/auth?next=promo&from=${encodeURIComponent(source)}`);
  };

  return (
    <div className={variant === "card" ? "rounded-2xl border border-border bg-card p-6" : ""}>
      {variant === "card" && (
        <>
          <p className="text-[10px] tracking-luxe uppercase text-accent mb-2">— {lang === "en" ? (phase === "launch" ? "Launch offer" : "Welcome offer") : (phase === "launch" ? "Стартовая акция" : "Приветственная скидка")}</p>
          <p className="font-display text-xl mb-1">
            {lang === "en" ? `Get ${DISCOUNT}% off on Ozon` : `${DISCOUNT}% на первый заказ на Ozon`}
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            {lang === "en" ? "Choose how to receive it." : "Выберите способ получения."}
          </p>
        </>
      )}
      <div className={variant === "card" ? "flex flex-col sm:flex-row gap-2" : "flex gap-2"}>
        <button
          onClick={handleTelegram}
          className="flex-1 bg-foreground text-background rounded-full py-3 px-5 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          {lang === "en" ? "Via Telegram" : "Через Telegram"}
        </button>
        <button
          onClick={handleEmail}
          className="flex-1 border border-border rounded-full py-3 px-5 text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" />
          {lang === "en" ? "Register on site" : "На сайте"}
        </button>
      </div>
      <p className="text-[10px] tracking-luxe uppercase text-muted-foreground/60 mt-4 text-center">
        {lang === "en"
          ? "Telegram: subscribe to channel · Site: free account, code by email"
          : "Telegram — подписка на канал · Сайт — регистрация, код придёт на почту"}
      </p>
    </div>
  );
};

export default PromoGate;
