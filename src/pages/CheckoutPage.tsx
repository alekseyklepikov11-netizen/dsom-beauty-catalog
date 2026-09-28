// Чекаут D2C (демо-каркас). Скрыт, если cartEnabled=false → редирект на главную.
// Онлайн-оплата, фискализация и расчёт доставки подключаются ПОСЛЕ договоров
// эквайринга/кассы и деплоя Edge Functions (create-order / pay-init / calc-delivery).
// Пока checkoutEnabled=false: обзор корзины + «Заказ на сайте откроется …» + промокод.
// Контакты НЕ собираем (данные никуда не уходят — не просим их вводить).
// При checkoutEnabled=true: контакты (label/autocomplete/type) + согласие ПДн + заглушки доставки/оплаты.
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PromoGate from "@/components/PromoGate";
import { useCart } from "@/hooks/useCart";
import { LAUNCH_CONFIG, isCartEnabled, isCartDeliveryEnabled, isCheckoutEnabled } from "@/lib/launchConfig";
import { useAuth } from "@/hooks/useAuth";

const CheckoutPage = () => {
  if (!isCartEnabled()) return <Navigate to="/" replace />;
  return <CheckoutInner />;
};

const CheckoutInner = () => {
  const { i18n } = useTranslation();
  const en = i18n.language === "en";
  const { lines, subtotal, count } = useCart();
  const { user } = useAuth();
  useNavigate();
  const authedEmail = user?.email ?? "";
  const authedName = (user?.user_metadata?.full_name || user?.user_metadata?.name || "") as string;
  const fmt = (n: number) => n.toLocaleString(en ? "en-US" : "ru-RU") + " ₽";
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [consent, setConsent] = useState(false);
  const checkoutOn = isCheckoutEnabled();
  // Служебная страница: не индексируем. Title — «Оформление заказа — DSOM» (суффикс добавляет SEO).
  const seo = <SEO title={en ? "Checkout" : "Оформление заказа"} noindex />;
  const fieldCls =
    "ym-disable-keys w-full border border-border rounded-lg px-4 py-3 bg-transparent focus:outline-none focus:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/30";
  const labelCls = "block text-[11px] tracking-luxe uppercase text-muted-foreground mb-1.5";

  // Авторизованному предзаполняем контакты из профиля (грузится асинхронно).
  // Не перетираем то, что пользователь уже ввёл руками.
  useEffect(() => {
    if (user) setContact((c) => ({ ...c, email: c.email || authedEmail, name: c.name || authedName }));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (count === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        {seo}
        <Header />
        <main className="flex-1 container py-24 text-center">
          <h1 className="font-display text-3xl">{en ? "Your cart is empty" : "Корзина пуста"}</h1>
          <Link to="/catalog" className="inline-block mt-6 rounded-full bg-foreground text-background px-8 py-3 text-[11px] tracking-luxe uppercase">
            {en ? "To catalog" : "В каталог"}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {seo}
      <Header />
      <main className="flex-1 container py-12 lg:py-16">
        <h1 className="font-display text-4xl mb-10">{en ? "Checkout" : "Оформление заказа"}</h1>
        <div className="grid lg:grid-cols-[1fr_380px] gap-12">
          {!checkoutOn ? (
            // Оформление на сайте ещё не открыто: не собираем контакты, предлагаем промокод.
            <div className="space-y-8 max-w-md">
              <p className="font-display text-2xl leading-snug">
                {en
                  ? `Ordering on the site opens ${LAUNCH_CONFIG.launchWhenEn}`
                  : `Заказ на сайте откроется ${LAUNCH_CONFIG.launchWhenRu}`}
              </p>
              <PromoGate variant="card" source="checkout" />
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 text-[11px] tracking-luxe uppercase border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors"
              >
                ← {en ? "Back to catalog" : "Вернуться в каталог"}
              </Link>
            </div>
          ) : (
          <form className="space-y-10" noValidate onSubmit={(e) => e.preventDefault()}>
            <section>
              <h2 className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-4">{en ? "Contact" : "Контакты"}</h2>
              {user ? (
                <div className="space-y-3 max-w-md">
                  <div className="flex items-center justify-between gap-3 border border-border rounded-lg px-4 py-3 bg-secondary/30 text-sm">
                    <span className="text-muted-foreground shrink-0">{en ? "Signed in as" : "Вы вошли как"}</span>
                    <span className="font-medium truncate">{authedEmail}</span>
                  </div>
                  <div>
                    <label htmlFor="co-name" className={labelCls}>{en ? "Recipient name" : "Имя получателя"}</label>
                    <input id="co-name" name="name" autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={fieldCls} />
                  </div>
                  <div>
                    <label htmlFor="co-phone" className={labelCls}>{en ? "Phone" : "Телефон"}</label>
                    <input id="co-phone" name="tel" type="tel" autoComplete="tel" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={fieldCls} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-w-md">
                  <div>
                    <label htmlFor="co-name" className={labelCls}>{en ? "Name" : "Имя"}</label>
                    <input id="co-name" name="name" autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={fieldCls} />
                  </div>
                  <div>
                    <label htmlFor="co-phone" className={labelCls}>{en ? "Phone" : "Телефон"}</label>
                    <input id="co-phone" name="tel" type="tel" autoComplete="tel" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={fieldCls} />
                  </div>
                  <div>
                    <label htmlFor="co-email" className={labelCls}>Email</label>
                    <input id="co-email" name="email" type="email" autoComplete="email" inputMode="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={fieldCls} />
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    {en ? "Already have an account? " : "Уже есть аккаунт? "}
                    <Link to="/auth" className="text-accent hover:underline">{en ? "Sign in" : "Войти"}</Link>
                    {en ? " — or continue as a guest." : " — или продолжите как гость."}
                  </p>
                </div>
              )}
            </section>
            <section>
              <h2 className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-4">{en ? "Delivery" : "Доставка"}</h2>
              {isCartDeliveryEnabled() ? (
                <p className="text-sm text-muted-foreground">{en ? "Delivery options and pickup points will appear here." : "Выбор доставки и пунктов выдачи появится здесь."}</p>
              ) : (
                <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-4">
                  {en ? "Delivery is being set up — coming soon." : "Доставка в стадии подключения — скоро будет доступна."}
                </p>
              )}
            </section>

            <section>
              <label className="flex items-start gap-3 text-sm text-muted-foreground max-w-md cursor-pointer">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" required />
                <span>
                  {en ? (
                    <>
                      I agree to the{" "}
                      <Link to="/page/privacy" target="_blank" className="text-foreground border-b border-foreground/30 hover:border-foreground transition-colors">
                        Personal data processing policy
                      </Link>
                      . Name, phone and email are used only to process and deliver the order.
                    </>
                  ) : (
                    <>
                      Я соглашаюсь с{" "}
                      <Link to="/page/privacy" target="_blank" className="text-foreground border-b border-foreground/30 hover:border-foreground transition-colors">
                        Политикой обработки персональных данных
                      </Link>
                      . Имя, телефон и email используются только для оформления и доставки заказа.
                    </>
                  )}
                </span>
              </label>
            </section>
          </form>
          )}

          <aside className="lg:sticky lg:top-24 h-fit border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-[11px] tracking-luxe uppercase text-muted-foreground">{en ? "Order" : "Заказ"}</h2>
            <div className="space-y-3">
              {lines.map((l) => {
                const nm = en && l.nameEn ? l.nameEn : l.name;
                return (
                  <div key={l.productId} className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0">{nm} × {l.qty}</span>
                    <span className="whitespace-nowrap lining-nums tabular-nums">{fmt(l.price * l.qty)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border pt-4 flex justify-between font-display text-xl">
              <span>{en ? "Total" : "Итого"}</span>
              <span className="lining-nums tabular-nums">{fmt(subtotal)}</span>
            </div>
            {checkoutOn && (
            <>
            <button
              disabled
              title={en ? "Online payment is being connected" : "Онлайн-оплата подключается"}
              className="w-full rounded-full bg-foreground/40 text-background py-3.5 text-[11px] tracking-luxe uppercase cursor-not-allowed"
            >
              {en ? "Pay (coming soon)" : "Оплатить (скоро)"}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">
              {en ? "Payment & fiscalization are being connected." : "Оплата и фискализация в стадии подключения."}
            </p>
            </>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
