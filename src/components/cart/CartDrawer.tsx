// Слайд-овер корзины. Открывается при добавлении товара и по иконке в шапке.
// Скрыт целиком, если LAUNCH_CONFIG.cartEnabled = false (фича-флаг).
// Построен на Radix Dialog (ui/sheet): Esc, ловушка фокуса, блок прокрутки, возврат фокуса на иконку,
// в закрытом состоянии панель размонтирована — нет тени у края и невидимых кнопок в порядке Tab.
// Пока оплата не подключена (isCheckoutEnabled() = false), вместо «Оформить заказ» — строка о старте
// и получение промокода (тот же PromoGate, что на главной, в каталоге и на странице товара).
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Sheet, SheetOverlay, SheetPortal, SheetTitle } from "@/components/ui/sheet";
import PromoGate from "@/components/PromoGate";
import { useCart } from "@/hooks/useCart";
import { LAUNCH_CONFIG, currentPhase, isCartEnabled, isCheckoutEnabled } from "@/lib/launchConfig";

const CartDrawer = () => {
  if (!isCartEnabled()) return null;
  return <CartDrawerInner />;
};

const CartDrawerInner = () => {
  const { t, i18n } = useTranslation();
  const en = i18n.language === "en";
  const { isOpen, open, close, lines, setQty, remove, subtotal, count } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const fmt = (n: number) => n.toLocaleString(en ? "en-US" : "ru-RU") + " ₽";
  const empty = lines.length === 0;
  const checkoutEnabled = isCheckoutEnabled();
  const discount =
    currentPhase() === "launch" ? LAUNCH_CONFIG.launchDiscountPercent : LAUNCH_CONFIG.welcomeDiscountPercent;

  // Окно открывается без Radix-Trigger, поэтому возврат фокуса делаем сами:
  // запоминаем элемент, с которого открыли, и возвращаем на него (или на кнопку в шапке).
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onOpenAutoFocus = () => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
  };
  const onCloseAutoFocus = (e: Event) => {
    e.preventDefault();
    const prev = returnFocusRef.current;
    const target =
      prev && prev.isConnected && prev !== document.body
        ? prev
        : (document.querySelector("header button[data-cart-trigger]") as HTMLElement | null);
    target?.focus();
  };

  // Переход на другую страницу (например, из PromoGate на /auth) — закрыть корзину.
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Sheet open={isOpen} onOpenChange={(v) => (v ? open() : close())}>
      <SheetPortal>
        <SheetOverlay className="z-[60] bg-foreground/40 backdrop-blur-sm" />
        <SheetPrimitive.Content
          aria-modal="true"
          onOpenAutoFocus={onOpenAutoFocus}
          onCloseAutoFocus={onCloseAutoFocus}
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-[61] h-full w-full max-w-md bg-background shadow-2xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=closed]:duration-300 data-[state=open]:duration-300"
        >
          <div className="flex items-center justify-between pl-6 pr-3 py-2 border-b border-border/60">
            <SheetTitle className="font-sans text-[11px] font-normal tracking-luxe uppercase text-foreground">
              {t("cart.title")}{count ? ` · ${count}` : ""}
            </SheetTitle>
            <SheetPrimitive.Close
              aria-label={t("a11y.close")}
              className="inline-flex items-center justify-center w-11 h-11 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </SheetPrimitive.Close>
          </div>

          {empty ? (
            <div className="flex-1 grid place-items-center text-center px-8">
              <div>
                <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/50" aria-hidden="true" />
                <p className="mt-4 text-muted-foreground">{t("cart.empty")}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {lines.map((l) => {
                const nm = en && l.nameEn ? l.nameEn : l.name;
                return (
                  <div key={l.productId} className="flex gap-4">
                    <div className="w-20 h-24 bg-secondary shrink-0 overflow-hidden rounded">
                      {l.image && <img src={l.image} alt={nm} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-base leading-tight">{nm}</p>
                      {l.volume && <p className="text-[11px] text-muted-foreground">{l.volume}</p>}
                      <p className="text-sm mt-1">{fmt(l.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-border rounded-full">
                          <button
                            type="button"
                            onClick={() => setQty(l.productId, l.qty - 1)}
                            aria-label={t("a11y.decrease", { name: nm })}
                            className="inline-flex items-center justify-center w-10 h-10 disabled:opacity-30"
                            disabled={l.qty <= 1}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-1 text-sm tabular-nums" aria-live="polite">{l.qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(l.productId, l.qty + 1)}
                            aria-label={t("a11y.increase", { name: nm })}
                            className="inline-flex items-center justify-center w-10 h-10"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(l.productId)}
                          aria-label={t("a11y.remove", { name: nm })}
                          className="inline-flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!empty && (
            <div className="border-t border-border/60 px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">{t("cart.subtotal")}</span>
                <span className="font-display text-xl">{fmt(subtotal)}</span>
              </div>
              {checkoutEnabled ? (
                <button
                  type="button"
                  onClick={() => { close(); navigate("/checkout"); }}
                  className="w-full rounded-full bg-foreground text-background py-3.5 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
                >
                  {t("cart.checkout")}
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("cart.soon", { when: en ? LAUNCH_CONFIG.launchWhenEn : LAUNCH_CONFIG.launchWhenRu })}
                  </p>
                  <p className="text-[11px] tracking-luxe uppercase text-foreground">
                    {t("cart.promo", { pct: discount })}
                  </p>
                  {/* В узкой панели кнопки PromoGate ставим друг под другом */}
                  <div className="[&>div>div]:flex-col">
                    <PromoGate variant="inline" source="cart" />
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
};

export default CartDrawer;
