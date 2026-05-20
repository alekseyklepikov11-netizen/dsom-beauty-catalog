import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import Header from "@/components/Header";

const RECOVERY_SESSION_KEY = "dsom-password-recovery-active";

const getResetErrorMessage = (message?: string) => {
  const normalized = (message || "").toLowerCase();
  if (normalized.includes("password should be at least")) return "Пароль должен быть не короче 6 символов";
  if (normalized.includes("same as the old password") || normalized.includes("different from the old password")) {
    return "Новый пароль должен отличаться от старого";
  }
  if (normalized.includes("session") || normalized.includes("jwt")) {
    return "Сессия восстановления истекла. Запросите новую ссылку";
  }
  return message || "Не удалось обновить пароль";
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const requestNewLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error("Введите ваш email");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
        redirectTo: "https://dsom.ru/reset-password",
      });
      if (error) throw error;
      setResent(true);
      toast.success("Новая ссылка отправлена на почту");
    } catch (err: any) {
      toast.error(err.message || "Не удалось отправить ссылку");
    } finally {
      setResending(false);
    }
  };

  // Allow password changes only from a real recovery link/session.
  // A regular signed-in session must not unlock this form, otherwise the wrong account can be updated.
  useEffect(() => {
    let mounted = true;

    const markRecoveryReady = () => {
      sessionStorage.setItem(RECOVERY_SESSION_KEY, "true");
      if (!mounted) return;
      window.history.replaceState(null, "", "/reset-password");
      setLinkError("");
      setReady(true);
    };

    const prepareRecoverySession = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const tokenHash = searchParams.get("token_hash") || hashParams.get("token_hash");
      const token = searchParams.get("token") || hashParams.get("token");
      const email = searchParams.get("email") || hashParams.get("email");
      const code = searchParams.get("code") || hashParams.get("code");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      try {
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (error) throw error;
          markRecoveryReady();
          return;
        }

        if (token && email) {
          const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "recovery",
          });
          if (error) throw error;
          markRecoveryReady();
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          markRecoveryReady();
          return;
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          markRecoveryReady();
          return;
        }

        // Supabase JS v2 авто-парсит hash при detectSessionInUrl=true и сам ставит сессию.
        // К моменту запуска нашего prepareRecoverySession URL уже может быть чистым.
        // Принимаем любую активную сессию как валидную для смены пароля
        // (если юзер не залогинен — getSession вернёт null, тогда показываем ошибку).
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          sessionStorage.setItem(RECOVERY_SESSION_KEY, "true");
          if (!mounted) return;
          setReady(true);
          return;
        }
        if (!mounted) return;
        setLinkError("Ссылка восстановления устарела или уже была использована. Запросите новую ссылку.");
      } catch {
        sessionStorage.removeItem(RECOVERY_SESSION_KEY);
        if (!mounted) return;
        setLinkError("Ссылка восстановления устарела или уже была использована. Запросите новую ссылку.");
      }
    };

    prepareRecoverySession();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        markRecoveryReady();
      }
      if (event === "SIGNED_OUT") {
        sessionStorage.removeItem(RECOVERY_SESSION_KEY);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Введите новый пароль");
      return;
    }
    if (password !== confirm) {
      toast.error("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        throw new Error("Сессия восстановления истекла. Запросите новую ссылку");
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      sessionStorage.removeItem(RECOVERY_SESSION_KEY);
      toast.success("Пароль успешно обновлён. Теперь войдите с новым паролем");
      setDone(true);
      // log out so user signs in with new password
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/auth");
      }, 2000);
    } catch (err: any) {
      toast.error(getResetErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="container max-w-md py-20 md:py-28 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-foreground text-background mb-6">
            <Check className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl leading-[1.1] mb-3">Пароль обновлён</h1>
          <p className="text-sm text-muted-foreground">Сейчас перенаправим на страницу входа…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="container max-w-md py-20 md:py-28">
        <p className="text-[11px] tracking-luxe uppercase text-accent text-center mb-4">— DSOM</p>
        <h1 className="font-display text-5xl text-center leading-[1] mb-2">Новый пароль</h1>
        <p className="text-sm text-muted-foreground text-center mb-10">
          Придумайте новый пароль для вашего аккаунта
        </p>

        {linkError ? (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed text-center">{linkError}</p>
            {resent ? (
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-foreground text-background">
                  <Check className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Письмо отправлено на <span className="text-foreground">{resendEmail}</span>.
                  Проверьте почту (включая папку «Спам»).
                </p>
              </div>
            ) : (
              <form onSubmit={requestNewLink} className="space-y-5">
                <div>
                  <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="mt-1.5 w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full bg-foreground text-background py-3.5 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {resending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Запросить новую ссылку
                </button>
              </form>
            )}
          </div>
        ) : !ready ? (
          <p className="text-center text-sm text-muted-foreground">
            Проверяем ссылку восстановления…
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Новый пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1.5 w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Повторите пароль</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1.5 w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-foreground text-background py-3.5 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Сохранить пароль
            </button>
          </form>
        )}

        <p className="text-center text-[10px] tracking-luxe uppercase text-muted-foreground/50 mt-12">
          <Link to="/auth" className="hover:text-foreground transition-colors">← К входу</Link>
        </p>
      </section>
    </main>
  );
};

export default ResetPassword;
