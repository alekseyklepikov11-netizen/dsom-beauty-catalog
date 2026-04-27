import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, isEditor, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && isEditor) navigate("/admin", { replace: true });
  }, [user, isEditor, authLoading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Вы успешно вошли в аккаунт");
      // wait a tick for roles
      setTimeout(() => navigate("/admin", { replace: true }), 200);
    } catch (err: any) {
      const message = (err.message || "").toLowerCase().includes("invalid login credentials")
        ? "Неверный email или пароль"
        : err.message || "Ошибка входа";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-foreground text-background grid place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="inline-grid place-items-center w-12 h-12 rounded-full bg-background/10 mb-6">
            <Lock className="w-4 h-4" />
          </div>
          <p className="text-[11px] tracking-luxe uppercase text-background/50 mb-3">DSOM · Admin</p>
          <h1 className="font-display text-4xl">Панель управления</h1>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-[10px] tracking-luxe uppercase text-background/50">Email</label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full bg-transparent border-b border-background/30 focus:border-background outline-none py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-luxe uppercase text-background/50">Пароль</label>
            <input
              type="password" required autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full bg-transparent border-b border-background/30 focus:border-background outline-none py-2 text-sm"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full mt-4 bg-background text-foreground py-3.5 rounded-full text-[11px] tracking-luxe uppercase hover:bg-accent hover:text-background transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Войти в админку
          </button>
        </form>

        <p className="text-center text-[10px] tracking-luxe uppercase text-background/40 mt-12">
          <Link to="/" className="hover:text-background transition-colors">← На сайт</Link>
        </p>
      </div>
    </main>
  );
};

export default AdminLogin;
