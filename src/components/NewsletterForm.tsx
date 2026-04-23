import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email().max(255),
});

const NewsletterForm = ({ source = "footer" }: { source?: string }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error(lang === "en" ? "Invalid email" : "Неверный email");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data.email.toLowerCase(), source, is_active: true });
    setLoading(false);

    if (error) {
      // duplicate => still treat as success for UX (don't reveal who's subscribed)
      if (error.code === "23505") {
        setDone(true);
        return;
      }
      toast.error(lang === "en" ? "Could not subscribe" : "Не удалось подписаться");
      return;
    }
    setDone(true);
    toast.success(lang === "en" ? "Thanks for subscribing!" : "Спасибо за подписку!");
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-background/80">
        <Check className="w-4 h-4 text-accent" />
        <span>{lang === "en" ? "You're on the list." : "Вы подписаны."}</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-0 max-w-sm">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={lang === "en" ? "Your email" : "Ваш email"}
        className="flex-1 bg-transparent border-b border-background/30 focus:border-accent outline-none px-0 py-2 text-sm text-background placeholder:text-background/40 transition-colors"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        aria-label="Subscribe"
        className="ml-2 grid place-items-center w-9 h-9 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
};

export default NewsletterForm;
