import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ru: {
    translation: {
      nav: { catalog: "Каталог", about: "О бренде", stores: "Где купить", contact: "Контакты", shop: "В магазин", quiz: "Подбор ухода" },
      hero: { cta: "Получить промокод 5%", eyebrow: "DSOM · Лаборатория ухода", title1: "Активная косметика", title2: "с прозрачным составом" },
      sections: { bestsellers: "Бестселлеры", brands: "Бренды", philosophy: "Философия", all: "Весь каталог", new: "Новинки" },
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
        bestseller: "Бестселлер",
      },
      footer: { contacts: "Контакты", rights: "Все права защищены" },
    },
  },
  en: {
    translation: {
      nav: { catalog: "Catalog", about: "About", stores: "Where to buy", contact: "Contact", shop: "Shop", quiz: "Find your routine" },
      hero: { cta: "Get 5% launch promo", eyebrow: "DSOM · Skincare laboratory", title1: "Active cosmetics", title2: "with transparent formulas" },
      sections: { bestsellers: "Bestsellers", brands: "Brands", philosophy: "Philosophy", all: "Full catalog", new: "New in" },
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
        bestseller: "Bestseller",
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

export default i18n;
