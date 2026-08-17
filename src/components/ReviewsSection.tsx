import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { shouldQueryTable } from "@/lib/staticCatalog";
import { useAuth } from "@/hooks/useAuth";
import { track } from "@/lib/analytics";
import { toast } from "sonner";
import StarRating from "./StarRating";
import { Loader2 } from "lucide-react";

interface Review {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
  status: string;
}

interface Props {
  productId: string;
}

const ReviewsSection = ({ productId }: Props) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  // Согласие на публикацию отзыва (гость, 152-ФЗ): чекбокс обязателен, по умолчанию пуст
  const [guestConsent, setGuestConsent] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    // Пока отзывов нет (маркер в catalog.json / флаг) — не гоняем запрос впустую.
    // force=true после отправки отзыва: запрашиваем в любом случае.
    if (!force && !(await shouldQueryTable("reviews"))) {
      setReviews([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("reviews")
      .select("id,user_id,guest_name,rating,title,body,created_at,status")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);
    setReviews((data || []) as Review[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [productId]);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const submit = async () => {
    if (body.trim().length < 3) {
      toast.error(lang === "en" ? "Please write a review" : "Напишите текст отзыва");
      return;
    }
    if (!user && (!guestName.trim() || !guestEmail.trim())) {
      toast.error(lang === "en" ? "Please fill in name and email" : "Укажите имя и email");
      return;
    }
    if (!user && !guestConsent) {
      toast.error(
        lang === "en"
          ? "Please confirm your consent to publish the review"
          : "Отметьте согласие на публикацию отзыва"
      );
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        product_id: productId,
        rating,
        title: title.trim() || null,
        body: body.trim(),
      };
      if (user) {
        payload.user_id = user.id;
      } else {
        payload.guest_name = guestName.trim();
        payload.guest_email = guestEmail.trim();
        payload.consent_at = new Date().toISOString();
      }
      const { error } = await supabase.from("reviews").insert(payload);
      if (error) throw error;

      track("review_submit" as any, { product_id: productId, value: String(rating) });

      if (user) {
        toast.success(lang === "en" ? "Thanks for your review!" : "Спасибо за отзыв!");
      } else {
        toast.success(
          lang === "en"
            ? "Thanks! Your review will appear after moderation."
            : "Спасибо! Отзыв появится после модерации."
        );
      }
      setShowForm(false);
      setTitle("");
      setBody("");
      setRating(5);
      load(true);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full bg-transparent border-b border-border focus:border-foreground py-2 text-sm focus:outline-none transition-colors";

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">
            — {lang === "en" ? "Reviews" : "Отзывы"}
          </p>
          <h2 className="font-display text-3xl md:text-4xl">
            {lang === "en" ? "What clients say" : "Что говорят клиенты"}
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3 mt-3">
              <StarRating value={avg} readOnly size={16} />
              <span className="text-sm text-muted-foreground">
                {avg.toFixed(1)} · {reviews.length}{" "}
                {lang === "en" ? "reviews" : "отзывов"}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-[11px] tracking-luxe uppercase border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors"
        >
          {showForm
            ? lang === "en" ? "Cancel" : "Отмена"
            : lang === "en" ? "Write a review" : "Оставить отзыв"}
        </button>
      </div>

      {showForm && (
        <div className="bg-secondary/40 p-6 md:p-8 mb-10 space-y-5 animate-fade-up">
          <div>
            <p className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-2">
              {lang === "en" ? "Your rating" : "Ваша оценка"}
            </p>
            <StarRating value={rating} onChange={setRating} size={26} />
          </div>

          {!user && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] tracking-luxe uppercase text-muted-foreground">
                  {lang === "en" ? "Name" : "Имя"}
                </label>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={"ym-disable-keys " + inputCls}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-[11px] tracking-luxe uppercase text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className={"ym-disable-keys " + inputCls}
                  maxLength={200}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] tracking-luxe uppercase text-muted-foreground">
              {lang === "en" ? "Title (optional)" : "Заголовок (необязательно)"}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              maxLength={150}
            />
          </div>

          <div>
            <label className="text-[11px] tracking-luxe uppercase text-muted-foreground">
              {lang === "en" ? "Your review" : "Ваш отзыв"}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className={inputCls + " resize-y"}
              maxLength={4000}
            />
          </div>

          {!user && (
            <>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={guestConsent}
                  onChange={(e) => setGuestConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-foreground shrink-0"
                  required
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {lang === "en" ? (
                    <>
                      I agree to the publication of my review: the name will be visible to everyone,
                      the email is not published and is used only to contact me about the review (
                      <Link to="/page/privacy" target="_blank" className="text-foreground border-b border-foreground/30 hover:border-foreground transition-colors">Privacy policy</Link>
                      ).
                    </>
                  ) : (
                    <>
                      Согласен на публикацию отзыва: имя будет видно всем, email не публикуется и
                      нужен только для связи по отзыву (
                      <Link to="/page/privacy" target="_blank" className="text-foreground border-b border-foreground/30 hover:border-foreground transition-colors">Политика</Link>
                      ).
                    </>
                  )}
                </span>
              </label>
              <p className="text-xs text-muted-foreground italic">
                {lang === "en"
                  ? "Guest reviews require admin approval before being published."
                  : "Гостевые отзывы публикуются после модерации."}
              </p>
            </>
          )}

          <button
            onClick={submit}
            disabled={submitting || (!user && !guestConsent)}
            className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-6 py-2.5 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {lang === "en" ? "Submit review" : "Отправить отзыв"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground italic font-display text-xl">
          {lang === "en"
            ? "No reviews yet. Be the first."
            : "Отзывов пока нет. Будьте первым."}
        </p>
      ) : (
        <ul className="space-y-8">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-border pb-8 last:border-0">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <StarRating value={r.rating} readOnly size={14} />
                  {r.title && (
                    <h3 className="font-display text-xl mt-2">{r.title}</h3>
                  )}
                </div>
                <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="text-sm leading-relaxed mt-3 whitespace-pre-line">{r.body}</p>
              <p className="text-[11px] tracking-luxe uppercase text-muted-foreground mt-3">
                — {r.guest_name || (lang === "en" ? "Customer" : "Клиент")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ReviewsSection;
