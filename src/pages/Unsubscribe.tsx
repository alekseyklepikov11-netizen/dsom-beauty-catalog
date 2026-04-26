import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "ready" | "done" | "invalid">("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("email,is_active")
        .eq("unsubscribe_token", token)
        .maybeSingle();
      if (error || !data) {
        setState("invalid");
        return;
      }
      setEmail(data.email);
      setState(data.is_active ? "ready" : "done");
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", token);
    if (!error) setState("done");
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO title="Отписка от рассылки — DSOM" description="Отписка от информационной рассылки DSOM" />
      <Header />

      <section className="container max-w-md py-20 md:py-28 text-center">
        {state === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground tracking-luxe uppercase">Проверка ссылки</p>
          </div>
        )}

        {state === "invalid" && (
          <>
            <h1 className="font-display text-4xl leading-[1.1] mb-4">Ссылка недействительна</h1>
            <p className="text-sm text-muted-foreground mb-10">
              Возможно, вы уже отписались, либо ссылка была повреждена. Если хотите управлять подпиской — войдите в личный кабинет.
            </p>
            <Link
              to="/account"
              className="inline-block bg-foreground text-background px-7 py-3.5 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
            >
              Личный кабинет
            </Link>
          </>
        )}

        {state === "ready" && (
          <>
            <p className="text-[11px] tracking-luxe uppercase text-accent mb-4">— DSOM</p>
            <h1 className="font-display text-4xl leading-[1.1] mb-4">Отписаться от рассылки?</h1>
            <p className="text-sm text-muted-foreground mb-10">
              Вы больше не будете получать информационные письма от DSOM на адрес<br />
              <span className="text-foreground">{email}</span>
            </p>
            <button
              onClick={confirm}
              className="inline-block bg-foreground text-background px-7 py-3.5 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
            >
              Подтвердить отписку
            </button>
            <p className="mt-6">
              <Link to="/" className="text-[10px] tracking-luxe uppercase text-muted-foreground hover:text-foreground transition-colors">
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
              {email && <>Адрес <span className="text-foreground">{email}</span> исключён из рассылки.<br /></>}
              Если передумаете — подписку можно возобновить в личном кабинете.
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

export default Unsubscribe;
