// Слайд-овер корзины. Открывается при добавлении товара и по иконке в шапке.
// Скрыт целиком, если LAUNCH_CONFIG.cartEnabled = false (фича-флаг).
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { isCartEnabled } from "@/lib/launchConfig";

const CartDrawer = () => {
  if (!isCartEnabled()) return null;
  return <CartDrawerInner />;
};

const CartDrawerInner = () => {
  const { i18n } = useTranslation();
  const en = i18n.language === "en";
  const { isOpen, close, lines, setQty, remove, subtotal, count } = useCart();
  const navigate = useNavigate();
  const fmt = (n: number) => n.toLocaleString(en ? "en-US" : "ru-RU") + " ₽";
  const empty = lines.length === 0;

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={close}
        aria-hidden
      />
      <aside
        className={`fixed top-0 right-0 z-[61] h-full w-full max-w-md bg-background shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-label={en ? "Cart" : "Корзина"}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
          <span className="text-[11px] tracking-luxe uppercase">
            {en ? "Cart" : "Корзина"}{count ? ` · ${count}` : ""}
          </span>
          <button onClick={close} aria-label="Close" className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {empty ? (
          <div className="flex-1 grid place-items-center text-center px-8">
            <div>
              <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{en ? "Your cart is empty" : "Корзина пуста"}</p>
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
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-border rounded-full">
                        <button onClick={() => setQty(l.productId, l.qty - 1)} aria-label="−" className="px-2 py-1 disabled:opacity-30" disabled={l.qty <= 1}>
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-sm tabular-nums">{l.qty}</span>
                        <button onClick={() => setQty(l.productId, l.qty + 1)} aria-label="+" className="px-2 py-1">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => remove(l.productId)} aria-label="Remove" className="text-muted-foreground hover:text-foreground">
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
              <span className="text-[11px] tracking-luxe uppercase text-muted-foreground">{en ? "Subtotal" : "Сумма"}</span>
              <span className="font-display text-xl">{fmt(subtotal)}</span>
            </div>
            <button
              onClick={() => { close(); navigate("/checkout"); }}
              className="w-full rounded-full bg-foreground text-background py-3.5 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
            >
              {en ? "Checkout" : "Оформить заказ"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
