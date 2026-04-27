import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const EmailUnsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "ready" | "done" | "invalid" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (!res.ok) {
          setState("invalid");
          return;
        }
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setState("done");
          return;
        }
        if (data.valid) {
          setState("ready");
          return;
        }
        setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("loading");
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    if (error) {
      setState("error");
      return;
    }
    if (data?.success || data?.reason === "already_unsubscribed") {
      setState("done");
    } else {
      setState("error");
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO title="Отписка от писем — DSOM" description="Отписка от писем DSOM" />
      <Header />

      <section className="container max-w-md py-20 md:py-28 text-center">
        {state === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground tracking-luxe uppercase">Проверка ссылки</p>
          </div>
        )}

        {(state === "invalid" || state === "error") && (
          <>
            <h1 className="font-display text-4xl leading-[1.1] mb-4">
              {state === "error" ? "Что-то пошло не так" : "Ссылка недействительна"}
            </h1>
            <p className="text-sm text-muted-foreground mb-10">
              {state === "error"
                ? "Попробуйте перейти по ссылке ещё раз через несколько минут."
                : "Возможно, вы уже отписались, либо ссылка была повреждена."}
            </p>
            <Link
              to="/"
              className="inline-block bg-foreground text-background px-7 py-3.5 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
            >
              На главную
            </Link>
          </>
        )}

        {state === "ready" && (
          <>
            <p className="text-[11px] tracking-luxe uppercase text-accent mb-4">— DSOM</p>
            <h1 className="font-display text-4xl leading-[1.1] mb-4">Отписаться от писем?</h1>
            <p className="text-sm text-muted-foreground mb-10">
              Вы больше не будете получать письма от DSOM на этот адрес.
            </p>
            <button
              onClick={confirm}
              className="inline-block bg-foreground text-background px-7 py-3.5 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
            >
              Подтвердить отписку
            </button>
            <p className="mt-6">
              <Link
                to="/"
                className="text-[10px] tracking-luxe uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Передумал — на главную
              </Link>
            </p>
          </>
        )}

        {state === "done" && (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-foreground text-background mb-6">
              <Check className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-4xl leading-[1.1] mb-4">Вы отписаны</h1>
            <p className="text-sm text-muted-foreground mb-10">
              Адрес исключён из рассылки. Если передумаете — подпишитесь снова в любой момент.
            </p>
            <Link
              to="/"
              className="inline-block text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              ← На главную
            </Link>
          </>
        )}
      </section>
    </main>
  );
};

export default EmailUnsubscribe;
