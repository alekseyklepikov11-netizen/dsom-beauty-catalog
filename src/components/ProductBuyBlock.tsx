// Блок «Как купить» на странице товара — схема А «Два пути с подписями» (решение владельца 14.10.2026).
// Макет и разбор: dsom-tools/content-team/блок-покупки-2026-10-14/ (макет-А-два-пути.html, Разбор-блока-покупки.md).
//
//   01 На Ozon          — главный путь. Остаток есть: тёмная «Купить на Ozon». Нет: светлая «Карточка на Ozon»
//                          и (пока оплата на сайте выключена) ссылка «Сообщить, когда появится».
//   02 На сайте dsom.ru  — кнопка «В корзину» только при включённой оплате (LAUNCH_CONFIG.checkoutEnabled),
//                          иначе короткая строка. Без остатка на Ozon и с оплатой главной становится «В корзину».
//   Промокод            — строка «Промокод N% на первый заказ на Ozon · Получить →».
//   Телефон             — плавающая кнопка «цена · Купить на Ozon / В корзину», когда блок ушёл за верх экрана.
//
// Наличие на Ozon — живой запрос (lib/marketplaceStock.ts); нет данных или сверка старше суток = «нет в наличии».
// Ссылки на Ozon нет вовсе — прежний вид до старта: промокод и «Сообщить о поступлении».
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import MarketplaceButton from "@/components/MarketplaceButton";
import StockAlertDialog from "@/components/StockAlertDialog";
import PromoGate from "@/components/PromoGate";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { useCart } from "@/hooks/useCart";
import { LAUNCH_CONFIG, currentPhase, isCheckoutEnabled } from "@/lib/launchConfig";
import { fetchMarketplaceStock } from "@/lib/marketplaceStock";
import { hasCookieDecision } from "@/lib/cookieConsent";
import { track } from "@/lib/analytics";

interface BuyProduct {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  price: number;
  cover_image_url: string | null;
  volume: string | null;
}
interface MLink { id: string; kind: string; url: string; label: string | null }

interface Props {
  product: BuyProduct;
  links: MLink[];
  /** Название на текущем языке — для окна «Сообщить». */
  name: string;
  lang: string;
}

const kindOf = (l: MLink) => (l.kind || "").toLowerCase();

const ProductBuyBlock = ({ product, links, name, lang }: Props) => {
  const en = lang === "en";
  const pay = isCheckoutEnabled();
  const [stock, setStock] = useState<Record<string, boolean>>({});
  const [showPromo, setShowPromo] = useState(false);
  const blockRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let alive = true;
    setStock({});
    fetchMarketplaceStock(product.id).then((s) => { if (alive) setStock(s); });
    return () => { alive = false; };
  }, [product.id]);

  // WB пока не показываем как живой канал (карточки не созданы) — фильтр-предохранитель.
  const visible = links.filter((l) => !["wildberries", "wb"].includes(kindOf(l)));
  const ozon = visible.find((l) => kindOf(l) === "ozon") || null;
  const ozonInStock = !!ozon && stock.ozon === true;

  const pct = currentPhase() === "launch" ? LAUNCH_CONFIG.launchDiscountPercent : LAUNCH_CONFIG.welcomeDiscountPercent;
  const priceText = `${Number(product.price).toLocaleString(en ? "en-US" : "ru-RU")} ₽`;

  // ---------- Ссылки на Ozon нет: прежний вид до старта ----------
  if (!ozon) {
    const others = visible;
    return (
      <section ref={blockRef} className="mt-8" aria-labelledby="buy-title">
        <h2 id="buy-title" className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-4">
          {en ? "— How to buy" : "— Как купить"}
        </h2>
        {others.length > 0 && (
          <div className="flex flex-col gap-2.5 max-w-md mb-4">
            {others.map((l) => <MarketplaceButton key={l.id} kind={l.kind} url={l.url} label={l.label} productId={product.id} />)}
          </div>
        )}
        {pay && (
          <div className="max-w-md mb-4">
            <AddToCartButton product={product} variant="pill" tone="dark" />
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              {en ? "Pay on the site, delivery to a pickup point." : "Оплата на сайте, доставка в пункт выдачи."}
            </p>
          </div>
        )}
        <div className="max-w-md">
          {!pay && others.length === 0 && (
            <p className="text-sm text-muted-foreground mb-4 italic">
              {en
                ? `Launch on Ozon and dsom.ru. Get a ${pct}% promocode now.`
                : `Старт продаж на Ozon и dsom.ru. Получите промокод ${pct}% уже сейчас.`}
            </p>
          )}
          <PromoGate variant="card" source={`product:${product.slug}`} />
          {!pay && (
            <div className="mt-3">
              <StockAlertDialog productId={product.id} productName={name} />
            </div>
          )}
        </div>
        <BuySticky product={product} priceText={priceText} ozon={null} ozonInStock={false} pay={pay} en={en} blockRef={blockRef} />
      </section>
    );
  }

  // ---------- Схема А ----------
  const noteBase = "text-sm leading-relaxed text-foreground/80 mt-1.5 ml-[31px]";
  const note = `${noteBase} mb-3.5`;
  const num = "text-[11px] tracking-luxe uppercase text-muted-foreground tabular-nums";

  return (
    <section ref={blockRef} className="mt-8 sm:max-w-[480px]" aria-labelledby="buy-title">
      <h2 id="buy-title" className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-2">
        {en ? "— How to buy" : "— Как купить"}
      </h2>

      {/* 01 На Ozon */}
      <div className="pt-3 pb-6">
        <div className="flex items-baseline gap-3.5">
          <span className={num}>01</span>
          <h3 className="font-display text-2xl leading-[1.1]">{en ? "On Ozon" : "На Ozon"}</h3>
        </div>
        <p className={note}>
          {ozonInStock
            ? en ? "Delivery to Ozon pickup points across Russia." : "Доставка в пункт выдачи Ozon по всей России."
            : en ? "Not in stock on Ozon yet." : "Пока нет в наличии на Ozon."}
        </p>
        <div className="ml-[31px]">
          <MarketplaceButton
            kind="ozon"
            url={ozon.url}
            productId={product.id}
            tone={ozonInStock ? "dark" : "outline"}
            label={ozonInStock ? (en ? "Buy on Ozon" : "Купить на Ozon") : (en ? "Ozon product page" : "Карточка на Ozon")}
          />
          <p className="text-[11px] text-muted-foreground mt-2 leading-normal">
            {en ? "The Ozon product page opens in a new tab." : "Откроется страница товара на Ozon в новой вкладке."}
          </p>
          {!ozonInStock && !pay && (
            <StockAlertDialog productId={product.id} productName={name} appearance="link" />
          )}
        </div>
      </div>

      {/* 02 На сайте dsom.ru */}
      <div className="pt-[22px] pb-6 border-t border-border">
        <div className="flex items-baseline gap-3.5">
          <span className={num}>02</span>
          <h3 className="font-display text-2xl leading-[1.1]">{en ? "On dsom.ru" : "На сайте dsom.ru"}</h3>
        </div>
        <p className={pay ? note : noteBase}>
          {pay
            ? en ? "Pay on the site, delivery to a pickup point." : "Оплата на сайте, доставка в пункт выдачи."
            : ozonInStock
              ? en ? "Ordering on the site isn't open yet — for now you can buy on Ozon." : "Заказ на сайте пока не открыт — сейчас купить можно на Ozon."
              : en ? "Ordering on the site isn't open yet." : "Заказ на сайте пока не открыт."}
        </p>
        {pay && (
          <div className="ml-[31px]">
            <AddToCartButton product={product} variant="pill" tone={ozonInStock ? "outline" : "dark"} />
          </div>
        )}
      </div>

      {/* Промокод */}
      <div className="pt-[18px] border-t border-border">
        <div className="flex flex-wrap justify-between items-baseline gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
          <span>{en ? `${pct}% promo code for your first Ozon order` : `Промокод ${pct}% на первый заказ на Ozon`}</span>
          <button
            type="button"
            aria-expanded={showPromo}
            aria-controls="buy-promo"
            onClick={() => setShowPromo((v) => !v)}
            className="text-[11px] tracking-luxe uppercase text-foreground border-b border-foreground/30 pb-0.5 whitespace-nowrap hover:text-accent hover:border-accent transition-colors"
          >
            {en ? "Get →" : "Получить →"}
          </button>
        </div>
        {showPromo && (
          <div id="buy-promo" className="mt-4">
            <PromoGate variant="inline" source={`product:${product.slug}`} />
          </div>
        )}
      </div>

      <BuySticky product={product} priceText={priceText} ozon={ozon} ozonInStock={ozonInStock} pay={pay} en={en} blockRef={blockRef} />
    </section>
  );
};

// ---------- Плавающая кнопка на телефоне ----------
// Появляется, когда блок покупки ушёл за верх экрана. Над тёмным подвалом инвертируется (как MobileCtaBar).
// Пока на экране cookie-баннер — не показываем, иначе они перекрывают друг друга.
interface StickyProps {
  product: BuyProduct;
  priceText: string;
  ozon: MLink | null;
  ozonInStock: boolean;
  pay: boolean;
  en: boolean;
  blockRef: React.RefObject<HTMLElement>;
}

const BuySticky = ({ product, priceText, ozon, ozonInStock, pay, en, blockRef }: StickyProps) => {
  const { add } = useCart();
  const [visible, setVisible] = useState(false);
  const [overDark, setOverDark] = useState(false);
  const [cookieDecided, setCookieDecided] = useState(hasCookieDecision);

  // Что ведёт кнопка: остаток на Ozon есть → Ozon; нет, но оплата на сайте включена → корзина; иначе кнопки нет.
  const mode: "ozon" | "cart" | null = ozon && ozonInStock ? "ozon" : pay ? "cart" : null;

  useEffect(() => {
    const onConsent = () => setCookieDecided(true);
    window.addEventListener("dsom:cookie-consent", onConsent);
    return () => window.removeEventListener("dsom:cookie-consent", onConsent);
  }, []);

  useEffect(() => {
    if (!mode) return;
    const onScroll = () => {
      const el = blockRef.current;
      setVisible(!!el && el.getBoundingClientRect().bottom < 0);
      const footer = document.querySelector("footer");
      setOverDark(!!footer && footer.getBoundingClientRect().top <= window.innerHeight - 90);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mode, blockRef]);

  if (!mode || !cookieDecided) return null;

  const pill = `flex items-center justify-between gap-3 w-full rounded-full pl-[22px] pr-1.5 py-1.5 shadow-lg transition-colors duration-500 ${
    overDark ? "bg-background text-foreground" : "bg-foreground text-background"
  }`;
  const chip = `inline-flex items-center gap-2.5 rounded-full px-4 py-3 text-[11px] tracking-luxe uppercase ${
    overDark ? "bg-foreground/10" : "bg-white/15"
  }`;
  const price = <span className="font-display text-[22px] lining-nums tabular-nums">{priceText}</span>;

  return (
    <div
      aria-hidden={!visible}
      className={`md:hidden fixed bottom-4 left-4 right-4 z-50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      {mode === "ozon" && ozon ? (
        <a
          href={ozon.url}
          target="_blank"
          rel="noreferrer noopener"
          tabIndex={visible ? undefined : -1}
          onClick={() => track("marketplace_click", { product_id: product.id, value: "ozon", meta: { url: ozon.url, from: "sticky" } })}
          className={pill}
        >
          {price}
          <span className={chip}>
            <span aria-hidden className="w-2 h-2 rounded-full shrink-0 bg-[hsl(220_85%_55%)]" />
            {en ? "Buy on Ozon" : "Купить на Ozon"}
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </a>
      ) : (
        <button
          type="button"
          tabIndex={visible ? undefined : -1}
          onClick={() =>
            add({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              nameEn: product.name_en,
              price: Number(product.price),
              image: product.cover_image_url,
              volume: product.volume,
            })
          }
          className={pill}
        >
          {price}
          <span className={chip}>
            {en ? "Add to cart" : "В корзину"}
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  );
};

export default ProductBuyBlock;
