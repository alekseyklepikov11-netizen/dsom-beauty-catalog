import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ru: {
    translation: {
      nav: { catalog: "Каталог", about: "О бренде", stores: "Где купить", contact: "Контакты", shop: "Смотреть линейку", quiz: "Подбор ухода", journal: "Журнал", favorites: "Избранное", account: "Личный кабинет", login: "Войти" },
      a11y: {
        skip: "Перейти к содержимому",
        menu: "Меню",
        search: "Поиск",
        searchDialog: "Поиск по каталогу",
        closeSearch: "Закрыть поиск",
        cart: "Корзина",
        cartCount: "Корзина, товаров: {{count}}",
        favorites: "Избранное",
        close: "Закрыть",
        toCatalog: "Перейти в каталог",
        language: "Язык",
        decrease: "Уменьшить количество: {{name}}",
        increase: "Увеличить количество: {{name}}",
        remove: "Удалить из корзины: {{name}}",
        cookieClose: "Закрыть и отказаться",
        notifyEmail: "Email для уведомления",
      },
      cart: {
        title: "Корзина",
        empty: "Корзина пуста",
        subtotal: "Сумма",
        checkout: "Оформить заказ",
        soon: "Заказ на сайте откроется {{when}}",
        promo: "Получить промокод {{pct}}%",
      },
      hero: { eyebrow: "DSOM", title1: "Активная косметика", title2: "с прозрачным составом" },
      sections: { bestsellers: "Линейка", brands: "Бренды", philosophy: "Философия", all: "Весь каталог", new: "Новинки" },
      catalog: {
        title: "Каталог",
        subtitle: "Уход с архитектурой формул",
        all: "Все",
        sort: "Сортировка",
        sortNew: "Новинки",
        sortPriceAsc: "Цена ↑",
        sortPriceDesc: "Цена ↓",
        empty: "В этой категории пока нет товаров.",
        quickView: "Быстрый просмотр",
      },
      product: {
        buy: "Где купить",
        from: "от",
        volume: "Объём",
        ingredients: "Состав",
        howToUse: "Как применять",
        description: "Описание",
        marketplaces: "Купить на маркетплейсах",
        offline: "В офлайн-магазинах",
        openFull: "Полная страница товара",
        back: "Назад в каталог",
        new: "Новинка",
        bestseller: "Новинка",
      },
      footer: { contacts: "Контакты", rights: "Все права защищены" },
    },
  },
  en: {
    translation: {
      nav: { catalog: "Catalog", about: "About", stores: "Where to buy", contact: "Contact", shop: "Explore the range", quiz: "Find your routine", journal: "Journal", favorites: "Favorites", account: "My account", login: "Sign in" },
      a11y: {
        skip: "Skip to content",
        menu: "Menu",
        search: "Search",
        searchDialog: "Search the catalog",
        closeSearch: "Close search",
        cart: "Cart",
        cartCount: "Cart, items: {{count}}",
        favorites: "Favorites",
        close: "Close",
        toCatalog: "Go to catalog",
        language: "Language",
        decrease: "Decrease quantity: {{name}}",
        increase: "Increase quantity: {{name}}",
        remove: "Remove from cart: {{name}}",
        cookieClose: "Close and decline",
        notifyEmail: "Email for notification",
      },
      cart: {
        title: "Cart",
        empty: "Your cart is empty",
        subtotal: "Subtotal",
        checkout: "Checkout",
        soon: "Ordering on the site opens {{when}}",
        promo: "Get a {{pct}}% promo code",
      },
      hero: { eyebrow: "DSOM", title1: "Active cosmetics", title2: "with transparent formulas" },
      sections: { bestsellers: "The line", brands: "Brands", philosophy: "Philosophy", all: "Full catalog", new: "New in" },
      catalog: {
        title: "Catalog",
        subtitle: "Skincare with formula architecture",
        all: "All",
        sort: "Sort",
        sortNew: "New in",
        sortPriceAsc: "Price ↑",
        sortPriceDesc: "Price ↓",
        empty: "No products in this category yet.",
        quickView: "Quick view",
      },
      product: {
        buy: "Where to buy",
        from: "from",
        volume: "Volume",
        ingredients: "Ingredients",
        howToUse: "How to use",
        description: "Description",
        marketplaces: "Buy on marketplaces",
        offline: "In offline stores",
        openFull: "Open full product page",
        back: "Back to catalog",
        new: "New",
        bestseller: "New",
      },
      footer: { contacts: "Contact", rights: "All rights reserved" },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("dsom-lang") || "ru",
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
});

// Атрибут lang у <html> следует за языком интерфейса (скринридеры, переносы, перевод страницы).
const syncHtmlLang = (lng: string) => {
  if (typeof document !== "undefined") document.documentElement.lang = lng === "en" ? "en" : "ru";
};
syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
