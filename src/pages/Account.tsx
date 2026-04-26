import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  full_name: string | null;
  email: string | null;
  marketing_consent: boolean;
  marketing_consent_at: string | null;
  created_at: string;
}

const Account = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [name, setName] = useState("");
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name,email,marketing_consent,marketing_consent_at,created_at")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        toast.error("Не удалось загрузить профиль");
      } else if (data) {
        setProfile(data as Profile);
        setName(data.full_name || "");
        setMarketing(!!data.marketing_consent);
      }
      setLoading(false);
    })();
  }, [user]);

  const saveName = async () => {
    if (!user) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", user.id);
    setSavingName(false);
    if (error) toast.error(error.message);
    else toast.success("Сохранено");
  };

  const toggleMarketing = async (next: boolean) => {
    if (!user || !profile) return;
    setMarketing(next);

    const updates: any = {
      marketing_consent: next,
      marketing_consent_at: next ? new Date().toISOString() : profile.marketing_consent_at,
    };
    const { error: pErr } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (pErr) {
      setMarketing(!next);
      toast.error(pErr.message);
      return;
    }

    if (next) {
      // Подписать
      const { error } = await supabase.from("newsletter_subscribers").upsert(
        {
          email: user.email!,
          source: "account",
          consent_source: "account",
          consent_at: new Date().toISOString(),
          user_id: user.id,
          is_active: true,
          unsubscribed_at: null,
        },
        { onConflict: "email" }
      );
      if (error) console.warn(error);
      toast.success("Вы подписаны на рассылку DSOM");
    } else {
      // Отписать
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
        .eq("email", user.email!);
      if (error) console.warn(error);
      toast.success("Вы отписаны от рассылки");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <SEO title="Личный кабинет — DSOM" description="Управление аккаунтом DSOM" />
      <Header />

      <section className="container max-w-2xl py-16 md:py-24 flex-1">
        <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— Аккаунт</p>
        <h1 className="font-display text-4xl md:text-5xl leading-[1] mb-12">Личный кабинет</h1>

        {/* Профиль */}
        <div className="border-t border-border pt-8 mb-12">
          <h2 className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-6">Профиль</h2>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Имя</label>
              <div className="flex items-end gap-3 mt-1.5">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="flex-1 bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
                />
                <button
                  onClick={saveName}
                  disabled={savingName || name === (profile?.full_name || "")}
                  className="text-[10px] tracking-luxe uppercase text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors pb-2"
                >
                  {savingName ? "..." : "Сохранить"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Email</label>
              <p className="mt-1.5 text-sm border-b border-border py-2">{profile?.email}</p>
            </div>

            <div>
              <label className="text-[10px] tracking-luxe uppercase text-muted-foreground">Дата регистрации</label>
              <p className="mt-1.5 text-sm border-b border-border py-2">
                {profile && new Date(profile.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Подписка */}
        <div className="border-t border-border pt-8 mb-12">
          <h2 className="text-[10px] tracking-luxe uppercase text-muted-foreground mb-6">Рассылка</h2>

          <label className="flex items-start justify-between gap-6 cursor-pointer group">
            <div className="flex-1">
              <p className="text-sm">Получать новости и предложения DSOM</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Информационные письма о новинках, специальных условиях и событиях бренда. Отписаться можно в любой момент.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={marketing}
              onClick={() => toggleMarketing(!marketing)}
              className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${marketing ? "bg-foreground" : "bg-border"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform ${marketing ? "translate-x-5" : ""}`}
              />
            </button>
          </label>
        </div>

        {/* Выход */}
        <div className="border-t border-border pt-8">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Выйти из аккаунта
          </button>
          <p className="mt-6 text-[10px] tracking-luxe uppercase">
            <Link to="/favorites" className="text-muted-foreground hover:text-foreground transition-colors">→ Избранное</Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Account;
