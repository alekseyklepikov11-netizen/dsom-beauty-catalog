import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, Mail } from "lucide-react";
import Header from "@/components/Header";

// Public site key — safe to expose in client code
const TURNSTILE_SITE_KEY = "0x4AAAAAADESddF-sUahSVGU";
const APP_URL = "https://dsom.ru";

const getAuthErrorMessage = (message?: string) => {
  const normalized = (message || "").toLowerCase();
  if (normalized.includes("invalid login credentials")) return "Неверный email или пароль";
  if (normalized.includes("email not confirmed")) return "Подтвердите email перед входом";
  if (normalized.includes("password should be at least")) return "Пароль слишком короткий";
  return message || "Что-то пошло не так";
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

type Mode = "signin" | "signup" | "forgot" | "promo";

const AuthPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPromoFlow = searchParams.get("next") === "promo";
  const [mode, setMode] = useState<Mode>(isPromoFlow ? "promo" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [pdnConsent, setPdnConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<null | "signup" | "forgot" | "exists" | "already-sent">(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Статус виджета Turnstile: challenges.cloudflare.com из РФ грузится нестабильно,
  // молчаливый отказ оставлял форму без видимой причины «подтвердите, что вы не робот».
  const [captchaStatus, setCaptchaStatus] = useState<"loading" | "ready" | "failed">("loading");

  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Load Turnstile script + render widget on signup/promo mode
  useEffect(() => {
    if (mode !== "signup" && mode !== "promo") {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
      setCaptchaToken(null);
      return;
    }

    const renderWidget = () => {
      if (!captchaRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "light",
        callback: (token: string) => { setCaptchaToken(token); setCaptchaStatus("ready"); },
        "expired-callback": () => setCaptchaToken(null),
        "error-callback": () => { setCaptchaToken(null); setCaptchaStatus("failed"); },
      });
      setCaptchaStatus("ready");
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    setCaptchaStatus("loading");
    // Если за 10 секунд скрипт Cloudflare не поднялся — показываем видимую ошибку вместо тишины
    window.setTimeout(() => {
      if (!window.turnstile) setCaptchaStatus("failed");
    }, 10000);

    const existing = document.querySelector('script[data-turnstile]');
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
      s.async = true;
      s.defer = true;
      s.setAttribute("data-turnstile", "1");
      s.onerror = () => setCaptchaStatus("failed");
      window.onTurnstileLoad = renderWidget;
      document.head.appendChild(s);
    } else {
      window.onTurnstileLoad = renderWidget;
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [mode]);

  const resetCaptcha = () => {
    setCaptchaToken(null);
    if (widgetIdRef.current && window.turnstile) {
      try { window.turnstile.reset(widgetIdRef.current); } catch {}
    }
  };

  // Полная перезагрузка виджета по кнопке «Загрузить проверку ещё раз»
  const retryCaptcha = () => {
    setCaptchaStatus("loading");
    setCaptchaToken(null);
    if (widgetIdRef.current && window.turnstile) {
      try { window.turnstile.remove(widgetIdRef.current); } catch {}
    }
    widgetIdRef.current = null;
    document.querySelector('script[data-turnstile]')?.remove();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&retry=" + Date.now();
    s.async = true;
    s.defer = true;
    s.setAttribute("data-turnstile", "1");
    s.onerror = () => setCaptchaStatus("failed");
    window.onTurnstileLoad = () => {
      if (!captchaRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "light",
        callback: (token: string) => { setCaptchaToken(token); setCaptchaStatus("ready"); },
        "expired-callback": () => setCaptchaToken(null),
        "error-callback": () => { setCaptchaToken(null); setCaptchaStatus("failed"); },
      });
      setCaptchaStatus("ready");
    };
    document.head.appendChild(s);
    window.setTimeout(() => {
      if (!window.turnstile) setCaptchaStatus("failed");
    }, 10000);
  };

  /**
   * Server-side validation Cloudflare Turnstile токена через edge function.
   * Клиентский `captchaToken` непригоден как доказательство — его легко подделать.
   * Здесь edge function `verify-turnstile` обращается к challenges.cloudflare.com
   * с секретным ключом и подтверждает, что токен реально выдан виджетом.
   * Возвращает `true` если токен валиден; иначе показывает toast и ресетит виджет.
   */
  const verifyCaptcha = async (token: string | null): Promise<boolean> => {
    if (!token) {
      toast.error("Пожалуйста, подтвердите, что вы не робот");
      return false;
    }
    try {
      const { data, error } = await supabase.functions.invoke("verify-turnstile", {
        body: { token },
      });
      if (error || !data?.success) {
        console.warn("[turnstile] verification failed", { error, data });
        toast.error("Не удалось пройти проверку. Попробуйте ещё раз.");
        resetCaptcha();
        return false;
      }
      return true;
    } catch (err) {
      console.error("[turnstile] verify-turnstile invoke error", err);
      toast.error("Не удалось проверить капчу. Попробуйте позже.");
      resetCaptcha();
      return false;
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setSubmitted(null);
    setPassword("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup" || mode === "promo") {
      if (!pdnConsent) {
        toast.error("Необходимо согласие на обработку персональных данных");
        return;
      }
      if (!captchaToken) {
        toast.error("Пожалуйста, подтвердите, что вы не робот");
        return;
      }
    }
    if (mode === "signup") {
      if (password.length < 6) {
        toast.error("Пароль должен быть не короче 6 символов");
        return;
      }
      if (password !== passwordConfirm) {
        toast.error("Пароли не совпадают");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "promo") {
        // Server-side Turnstile check ПЕРЕД любым contact-с Supabase
        if (!(await verifyCaptcha(captchaToken))) return;

        // PRE-FLIGHT: если confirmed user уже существует → попросим войти, а не слать magic-link заново
        const { data: chk } = await supabase.rpc("check_user_email", { p_email: email });
        const row = Array.isArray(chk) && chk.length > 0 ? chk[0] : null;
        if (row?.user_exists && row?.is_confirmed) {
          setSubmitted("exists");
          return;
        }
        // Magic-link flow: только email (опционально имя), без пароля.
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            data: { ...(name ? { full_name: name } : {}), marketing_consent: marketingConsent },
            shouldCreateUser: true,
            emailRedirectTo: `${APP_URL}/promo-claim`,
          },
        });
        if (error) throw error;
        setSubmitted("signup"); // переиспользуем экран «проверьте почту»
      } else if (mode === "signup") {
        // Server-side Turnstile check ПЕРЕД signUp (защита от ботов)
        if (!(await verifyCaptcha(captchaToken))) return;

        // PRE-FLIGHT CHECK: существует ли юзер?
        // Используем серверную RPC чтобы избежать Supabase quirks с identities/timing.
        const { data: chk, error: chkErr } = await supabase.rpc("check_user_email", { p_email: email });
        if (chkErr) console.warn("[signup] check_user_email failed:", chkErr);
        const row = Array.isArray(chk) && chk.length > 0 ? chk[0] : null;
        if (row?.user_exists) {
          setSubmitted(row.is_confirmed ? "exists" : "already-sent");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              marketing_consent: marketingConsent,
            },
            emailRedirectTo: `${APP_URL}/promo-claim?from=signup`,
          },
        });
        if (error) throw error;
        setSubmitted("signup");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Вы успешно вошли в аккаунт");
        navigate(isPromoFlow ? "/promo-claim" : "/");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${APP_URL}/reset-password`,
        });
        if (error) throw error;
        setSubmitted("forgot");
      }
    } catch (err: any) {
      toast.error(getAuthErrorMessage(err.message));
      if (mode === "signup" || mode === "promo") resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // ---------- Success / info screens ----------
  if (submitted === "signup") {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="container max-w-md py-20 md:py-28 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-foreground text-background mb-6">
            <Mail className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl leading-[1.1] mb-3">Что дальше</h1>
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            Email: <span className="text-foreground">{email}</span>
          </p>

          <div className="mt-10 space-y-6 text-left">
            <div className="rounded-2xl border border-border p-5">
              <p className="text-[11px] tracking-luxe uppercase text-accent mb-2">— Если новый клиент</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Проверьте почту — мы отправили ссылку для подтверждения. Не пришло за пару минут?
                Проверьте папку «Спам».
              </p>
            </div>

            <div className="rounded-2xl border border-border p-5 bg-muted/30">
              <p className="text-[11px] tracking-luxe uppercase text-accent mb-2">— Если уже регистрировались</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Аккаунт с таким email уже мог быть создан раньше. Войдите по паролю
                или восстановите его.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => switchMode("signin")}
                  className="w-full bg-foreground text-background py-3 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
                >
                  Войти в аккаунт
                </button>
                <button
                  onClick={() => switchMode("forgot")}
                  className="w-full border border-border text-foreground py-3 rounded-full text-[11px] tracking-luxe uppercase hover:border-foreground transition-colors"
                >
                  Забыли пароль?
                </button>
              </div>
            </div>
          </div>

          <Link to="/" className="inline-block mt-12 text-[10px] tracking-luxe uppercase text-muted-foreground/70 hover:text-foreground transition-colors">
            ← На главную
          </Link>
        </section>
      </main>
    );
  }

  if (submitted === "forgot") {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="container max-w-md py-20 md:py-28 text-center">
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-4">— DSOM</p>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-foreground text-background mb-6">
            <Mail className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl leading-[1.05] mb-4">Ссылку отправили</h1>
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            Если аккаунт с адресом <span className="text-foreground">{email}</span> у нас есть —<br/>
            мы выслали ссылку для сброса пароля.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-4">
            Ссылка действует 1 час. Не пришло — посмотрите в «Спам».
          </p>

          <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-5 text-left">
            <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— Пока ждёте</p>
            <p className="text-sm text-foreground font-display italic leading-snug mb-3">
              «Косметика начинается не с упаковки, а с того что внутри.»
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              На <a href="/catalog" className="text-foreground underline underline-offset-2 hover:text-accent">странице каталога</a> мы открываем полный INCI каждой формулы.
              Можно посмотреть какие активы и в каких концентрациях работают у нас —
              пока ждёте письмо.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-2">
            <button
              onClick={() => switchMode("signin")}
              className="w-full border border-border text-foreground py-3 rounded-full text-[11px] tracking-luxe uppercase hover:border-foreground transition-colors"
            >
              ← Вернуться ко входу
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (submitted === "already-sent") {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="container max-w-md py-20 md:py-28 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/15 text-accent mb-6">
            <Mail className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl leading-[1.1] mb-3">Письмо уже отправлено</h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Мы недавно отправили вам ссылку для подтверждения на<br />
            <span className="text-foreground">{email}</span>
            <br /><br />
            Проверьте почту и папку «Спам». Письмо может прийти в течение пары минут.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => switchMode("signin")}
              className="w-full bg-foreground text-background py-3.5 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
            >
              У меня уже есть пароль — войти
            </button>
          </div>
          <Link to="/" className="inline-block mt-12 text-[10px] tracking-luxe uppercase text-muted-foreground/70 hover:text-foreground transition-colors">
            ← На главную
          </Link>
        </section>
      </main>
    );
  }

  if (submitted === "exists") {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="container max-w-md py-20 md:py-28 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-foreground text-foreground mb-6">
            <Mail className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl leading-[1.1] mb-3">Аккаунт уже существует</h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Пользователь с email <span className="text-foreground">{email}</span> уже зарегистрирован.
            Войдите в свой аккаунт или восстановите пароль, если забыли его.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => switchMode("signin")}
              className="w-full bg-foreground text-background py-3.5 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
            >
              Войти в аккаунт
            </button>
            <button
              onClick={() => switchMode("forgot")}
              className="w-full border border-border text-foreground py-3.5 rounded-full text-[11px] tracking-luxe uppercase hover:border-foreground transition-colors"
            >
              Забыли пароль?
            </button>
          </div>
          <Link to="/" className="inline-block mt-12 text-[10px] tracking-luxe uppercase text-muted-foreground/70 hover:text-foreground transition-colors">
            ← На главную
          </Link>
        </section>
      </main>
    );
  }

  // ---------- Form ----------
  const titles: Record<Mode, { title: string; subtitle: string; cta: string }> = {
    promo: { title: "Получить промокод", subtitle: "Введите email — пришлём ссылку. По клику получите промокод сразу.", cta: "Прислать ссылку" },
    signin: { title: "Войти", subtitle: "Войдите в аккаунт DSOM", cta: "Войти" },
    signup: { title: "Регистрация", subtitle: "Создайте аккаунт — после подтверждения email подарим промокод 10%", cta: "Создать аккаунт" },
    forgot: { title: "Восстановление", subtitle: "Введите email — мы отправим ссылку для сброса пароля", cta: "Отправить ссылку" },
  };
  const { title, subtitle, cta } = titles[mode];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="container max-w-md py-20 md:py-28">
        <p className="text-[11px] tracking-luxe uppercase text-accent text-center mb-4">— DSOM</p>
        <h1 className="font-display text-5xl text-center leading-[1] mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground text-center mb-10">{subtitle}</p>

        <form onSubmit={submit} className="space-y-5">
          {(mode === "signup" || mode === "promo") && (
            <div>
              <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">
                Имя {mode === "promo" && <span className="opacity-50">(опционально)</span>}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={mode === "signup"}
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

          {mode !== "forgot" && mode !== "promo" && (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Пароль</label>
                  {mode === "signup" && (
                    <span className="text-[10px] text-muted-foreground/70">мин. 6 символов</span>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "signup" ? 6 : undefined}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="mt-1.5 w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
                />
              </div>
              {mode === "signup" && (
                <div>
                  <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Подтвердите пароль</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required minLength={6} autoComplete="new-password"
                    className="mt-1.5 w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
                  />
                  {passwordConfirm && password !== passwordConfirm && (
                    <p className="mt-1.5 text-[10px] text-destructive">Пароли не совпадают</p>
                  )}
                </div>
              )}
            </>
          )}

          {(mode === "signup" || mode === "promo") && (
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

              {(mode === "signup" || mode === "promo") && (
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border accent-foreground shrink-0"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Хочу получать новости, разборы составов и анонсы DSOM на email. Отписаться можно в любой момент.
                  </span>
                </label>
              )}

              {/* Cloudflare Turnstile widget */}
              <div className="pt-2 flex flex-col items-center gap-2">
                <div ref={captchaRef} />
                {captchaStatus === "failed" && (
                  <div className="text-center text-sm text-muted-foreground space-y-1">
                    <p>Проверка «я не робот» не загрузилась — такое бывает при включённом VPN или блокировщике рекламы.</p>
                    <button type="button" onClick={retryCaptcha} className="underline text-foreground">
                      Загрузить проверку ещё раз
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-foreground text-background py-3.5 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {cta}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground mt-8 space-y-2">
          {mode === "signin" && (
            <>
              <p>
                <button
                  onClick={() => switchMode("forgot")}
                  className="text-foreground border-b border-foreground hover:text-accent hover:border-accent transition-colors"
                >
                  Забыли пароль?
                </button>
              </p>
              <p>
                Ещё нет аккаунта?{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="text-foreground border-b border-foreground hover:text-accent hover:border-accent transition-colors"
                >
                  Регистрация
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p>
              Уже есть аккаунт?{" "}
              <button
                onClick={() => switchMode("signin")}
                className="text-foreground border-b border-foreground hover:text-accent hover:border-accent transition-colors"
              >
                Войти
              </button>
            </p>
          )}
          {mode === "promo" && (
            <>
              <p>
                Уже есть аккаунт?{" "}
                <button
                  onClick={() => switchMode("signin")}
                  className="text-foreground border-b border-foreground hover:text-accent hover:border-accent transition-colors"
                >
                  Войти и получить промокод
                </button>
              </p>
              <p className="text-muted-foreground/70 mt-3">
                Без пароля — мы пришлём одноразовую ссылку на email.<br/>
                После клика по ссылке вы попадёте на страницу со своим промокодом.
              </p>
            </>
          )}
          {mode === "forgot" && (
            <p>
              Вспомнили пароль?{" "}
              <button
                onClick={() => switchMode("signin")}
                className="text-foreground border-b border-foreground hover:text-accent hover:border-accent transition-colors"
              >
                Войти
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-[10px] tracking-luxe uppercase text-muted-foreground/50 mt-12">
          <Link to="/" className="hover:text-foreground transition-colors">← На главную</Link>
        </p>
      </section>
    </main>
  );
};

export default AuthPage;
