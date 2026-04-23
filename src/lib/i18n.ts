import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ru: {
    translation: {
      nav: { catalog: "Каталог", about: "О бренде", stores: "Где купить", contact: "Контакты" },
      hero: { cta: "Открыть каталог" },
      sections: { bestsellers: "Бестселлеры", brands: "Бренды", philosophy: "Философия" },
      product: { buy: "Где купить", from: "от", volume: "Объём" },
      footer: { contacts: "Контакты", rights: "Все права защищены" },
    },
  },
  en: {
    translation: {
      nav: { catalog: "Catalog", about: "About", stores: "Where to buy", contact: "Contact" },
      hero: { cta: "Open catalog" },
      sections: { bestsellers: "Bestsellers", brands: "Brands", philosophy: "Philosophy" },
      product: { buy: "Where to buy", from: "from", volume: "Volume" },
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
