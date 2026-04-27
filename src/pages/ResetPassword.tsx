import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import Header from "@/components/Header";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState("");

  // Supabase auto-creates a recovery session from the magic link in URL hash.
  // We listen for it before allowing the form.
  useEffect(() => {
    const prepareRecoverySession = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const token = params.get("token");
      const email = params.get("email");

      try {
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (error) throw error;
          window.history.replaceState(null, "", "/reset-password");
          setReady(true);
          return;
        }

        if (token && email) {
          const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "recovery",
          });
          if (error) throw error;
          window.history.replaceState(null, "", "/reset-password");
          setReady(true);
        }
      } catch {
        setLinkError("Ссылка восстановления устарела или уже была использована. Запросите новую ссылку.");
      }
    };

    prepareRecoverySession();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    // also check if already a session exists (user opened link, then page reloaded)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Минимум 8 символов");
      return;
    }
    if (password !== confirm) {
      toast.error("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      // log out so user signs in with new password
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/auth");
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || "Не удалось обновить пароль");
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
          <div className="text-center space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">{linkError}</p>
            <Link
              to="/auth"
              className="inline-flex bg-foreground text-background py-3.5 px-8 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
            >
              Запросить новую ссылку
            </Link>
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
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5 w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
              />
              <p className="text-[10px] text-muted-foreground/70 mt-2">Минимум 8 символов</p>
            </div>
            <div>
              <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Повторите пароль</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
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
