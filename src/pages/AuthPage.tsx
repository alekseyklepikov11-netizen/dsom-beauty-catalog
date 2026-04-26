import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import Header from "@/components/Header";

const AuthPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pdnConsent, setPdnConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup" && !pdnConsent) {
      toast.error("Необходимо согласие на обработку персональных данных");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              marketing_consent: marketingConsent,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        setSubmitted(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("С возвращением.");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="container max-w-md py-20 md:py-28 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-foreground text-background mb-6">
            <Check className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl leading-[1.1] mb-3">Проверьте почту</h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Мы отправили письмо со ссылкой подтверждения на<br />
            <span className="text-foreground">{email}</span>
          </p>
          <p className="text-xs text-muted-foreground/70">
            Если письмо не пришло в течение пары минут, проверьте папку «Спам».
          </p>
          <Link
            to="/"
            className="inline-block mt-12 text-[10px] tracking-luxe uppercase text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            ← На главную
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="container max-w-md py-20 md:py-28">
        <p className="text-[11px] tracking-luxe uppercase text-accent text-center mb-4">— DSOM</p>
        <h1 className="font-display text-5xl text-center leading-[1] mb-2">
          {mode === "signin" ? "Войти" : "Регистрация"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-10">
          {mode === "signin" ? "Войдите в аккаунт DSOM" : "Создайте аккаунт DSOM"}
        </p>

        <form onSubmit={submit} className="space-y-5">
          {mode === "signup" && (
            <div>
              <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="mt-1.5 w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email" maxLength={255}
              className="mt-1.5 w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="mt-1.5 w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
            />
            {mode === "signup" && (
              <p className="text-[10px] text-muted-foreground/70 mt-2">Минимум 8 символов</p>
            )}
          </div>

          {mode === "signup" && (
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={pdnConsent}
                  onChange={(e) => setPdnConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-foreground shrink-0"
                  required
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Я согласен(а) на{" "}
                  <Link to="/page/privacy" target="_blank" className="text-foreground border-b border-foreground/30 hover:border-foreground transition-colors">
                    обработку персональных данных
                  </Link>{" "}
                  в соответствии с политикой конфиденциальности <span className="text-destructive">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-foreground shrink-0"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Хочу получать новости, специальные предложения и информацию о новинках DSOM на email. Отписаться можно в любой момент.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-foreground text-background py-3.5 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {mode === "signin" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {mode === "signin" ? "Ещё нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-foreground border-b border-foreground hover:text-accent hover:border-accent transition-colors"
          >
            {mode === "signin" ? "Регистрация" : "Войти"}
          </button>
        </p>

        <p className="text-center text-[10px] tracking-luxe uppercase text-muted-foreground/50 mt-12">
          <Link to="/" className="hover:text-foreground transition-colors">← На главную</Link>
        </p>
      </section>
    </main>
  );
};

export default AuthPage;
