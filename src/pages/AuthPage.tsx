import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";

const AuthPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Аккаунт создан. Добро пожаловать!");
        navigate("/");
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
              required autoComplete="email"
              className="mt-1.5 w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="mt-1.5 w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
            />
          </div>

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
