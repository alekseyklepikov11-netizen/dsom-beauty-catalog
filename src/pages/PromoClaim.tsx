import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { LAUNCH_CONFIG } from "@/lib/launchConfig";
import { track } from "@/lib/analytics";
import { ymGoal } from "@/lib/metrika";

type State =
  | { stage: "loading" }
  | { stage: "needs-login" }
  | { stage: "needs-confirm" }
  | { stage: "success"; code: string; discount: number; validUntil: string; repeat: boolean }
  | { stage: "error"; message: string };

const PromoClaim = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromSignup = searchParams.get("from") === "signup";
  const [state, setState] = useState<State>({ stage: "loading" });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setState({ stage: "needs-login" }); return; }
    if (!user.email_confirmed_at && !(user as any).confirmed_at) {
      setState({ stage: "needs-confirm" });
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("claim-promo-code", { body: {} });
        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || "claim failed");
        setState({
          stage: "success",
          code: data.code,
          discount: data.discount,
          validUntil: data.valid_until,
          repeat: !!data.repeat,
        });
        track("promo_click", { value: `claimed:email:${data.code}` });
        ymGoal("email_promo_claimed", { code: data.code });
      } catch (err: any) {
        setState({ stage: "error", message: err?.message || "unknown" });
      }
    })();
  }, [user, authLoading]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", {
        day: "numeric", month: "long", year: "numeric",
      });
    } catch { return iso; }
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO title={lang === "en" ? "Your promocode" : "Ваш промокод"} />
      <Header />
      <section className="container max-w-md py-20 md:py-28 text-center">
        {state.stage === "loading" && (
          <>
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-accent mb-6" />
            <p className="text-sm text-muted-foreground">
              {lang === "en" ? "Issuing promocode..." : "Выписываем промокод..."}
            </p>
          </>
        )}

        {state.stage === "needs-login" && (
          <>
            <h1 className="font-display text-3xl mb-3">
              {lang === "en" ? "Sign in to claim" : "Войдите чтобы получить промокод"}
            </h1>
            <Link
              to={`/auth?next=promo`}
              className="inline-block mt-6 bg-foreground text-background px-8 py-3 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
            >
              {lang === "en" ? "Sign in / Register" : "Войти / Регистрация"}
            </Link>
          </>
        )}

        {state.stage === "needs-confirm" && (
          <>
            <AlertCircle className="w-8 h-8 mx-auto text-accent mb-6" />
            <h1 className="font-display text-3xl mb-3">
              {lang === "en" ? "Confirm your email" : "Подтвердите email"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === "en"
                ? "Check your inbox for the confirmation link. After confirmation reload this page."
                : "Откройте письмо со ссылкой подтверждения. После подтверждения обновите эту страницу."}
            </p>
          </>
        )}

        {state.stage === "success" && (
          <>
            {fromSignup ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/15 text-accent mb-6">
                  <Sparkles className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">
                  {lang === "en" ? "— Welcome to DSOM" : "— Добро пожаловать в DSOM"}
                </p>
                <h1 className="font-display text-4xl md:text-5xl leading-[1.05] mb-4">
                  {lang === "en" ? "You're registered" : "Поздравляем с регистрацией"}
                </h1>
                <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                  {lang === "en"
                    ? "As our first customer who trusted the brand before the launch — please accept a gift promocode for your first order on Ozon."
                    : "Как первому клиенту, доверившемуся бренду ещё до старта продаж — примите в подарок промокод на первый заказ на Ozon."}
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-foreground text-background mb-6">
                  <Check className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h1 className="font-display text-4xl leading-[1.1] mb-3">
                  {lang === "en" ? "Your promocode" : "Ваш промокод"}
                </h1>
              </>
            )}
            <div className="inline-block bg-foreground text-background px-8 py-4 rounded-2xl my-2">
              <p className="font-display text-4xl tracking-[0.25em] font-semibold">{state.code}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-6 mb-2">
              {lang === "en"
                ? `${state.discount}% off on first order on Ozon`
                : `Скидка ${state.discount}% на первый заказ на Ozon`}
            </p>
            <p className="text-sm text-muted-foreground">
              {lang === "en" ? "Valid until " : "Действует до "}
              <span className="text-foreground font-medium">{formatDate(state.validUntil)}</span>
            </p>
            <p className="text-xs text-muted-foreground/70 mt-6">
              {state.repeat
                ? (lang === "en" ? "We've already issued this code to you — same code shown." : "Этот промокод уже был выдан вам ранее — показываем тот же.")
                : (lang === "en" ? "We also sent the code to your inbox." : "Также отправили промокод на вашу почту.")}
            </p>
            <div className="mt-10 flex flex-col gap-3">
              <Link to="/catalog" className="bg-foreground text-background py-3 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors">
                {lang === "en" ? "View products" : "Перейти в каталог"}
              </Link>
              <a href={LAUNCH_CONFIG.ozonSellerUrl + "&utm_medium=promo_claim"} target="_blank" rel="noopener noreferrer"
                className="border border-border py-3 rounded-full text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                {lang === "en" ? "Go to Ozon (after launch)" : "Открыть Ozon (с момента старта)"}
              </a>
            </div>
          </>
        )}

        {state.stage === "error" && (
          <>
            <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-6" />
            <h1 className="font-display text-3xl mb-3">
              {lang === "en" ? "Could not issue promocode" : "Не удалось выдать промокод"}
            </h1>
            <p className="text-sm text-muted-foreground mb-2">{state.message}</p>
            <p className="text-xs text-muted-foreground/70 mt-6">
              {lang === "en" ? "Write to hello@dsom.ru — we'll help." : "Напишите на hello@dsom.ru — мы поможем."}
            </p>
          </>
        )}
      </section>
    </main>
  );
};

export default PromoClaim;
