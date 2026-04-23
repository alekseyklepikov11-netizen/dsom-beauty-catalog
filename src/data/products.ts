import serum from "@/assets/product-serum.jpg";
import cream from "@/assets/product-cream.jpg";
import cleanser from "@/assets/product-cleanser.jpg";
import spf from "@/assets/product-spf.jpg";
import oil from "@/assets/product-oil.jpg";
import toner from "@/assets/product-toner.jpg";

export type Category = "Все" | "Очищение" | "Тонизирование" | "Сыворотки" | "Увлажнение" | "Защита" | "Масла";

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  category: Exclude<Category, "Все">;
  volume: string;
  price: number;
  image: string;
  notes: string[];
  tag?: string;
}

export const categories: Category[] = [
  "Все",
  "Очищение",
  "Тонизирование",
  "Сыворотки",
  "Увлажнение",
  "Защита",
  "Масла",
];

export const products: Product[] = [
  {
    id: "01",
    name: "Sérum Lumière",
    subtitle: "Сыворотка с витамином C",
    category: "Сыворотки",
    volume: "30 мл",
    price: 4900,
    image: serum,
    notes: ["Витамин C", "Феруловая кислота", "Сияние"],
    tag: "Бестселлер",
  },
  {
    id: "02",
    name: "Crème Velours",
    subtitle: "Бархатистый ночной крем",
    category: "Увлажнение",
    volume: "50 мл",
    price: 5800,
    image: cream,
    notes: ["Сквалан", "Пептиды", "Восстановление"],
  },
  {
    id: "03",
    name: "Mousse Pure",
    subtitle: "Деликатное очищение",
    category: "Очищение",
    volume: "150 мл",
    price: 3200,
    image: cleanser,
    notes: ["Зелёный чай", "Без сульфатов", "Свежесть"],
  },
  {
    id: "04",
    name: "Voile Solaire",
    subtitle: "Минеральный SPF 50",
    category: "Защита",
    volume: "40 мл",
    price: 4200,
    image: spf,
    notes: ["Оксид цинка", "Невидимая защита", "Антиоксиданты"],
    tag: "Новинка",
  },
  {
    id: "05",
    name: "Huile Précieuse",
    subtitle: "Питательное масло для лица",
    category: "Масла",
    volume: "30 мл",
    price: 6400,
    image: oil,
    notes: ["Шиповник", "Жожоба", "Эластичность"],
  },
  {
    id: "06",
    name: "Eau Florale",
    subtitle: "Розовый цветочный тоник",
    category: "Тонизирование",
    volume: "200 мл",
    price: 3600,
    image: toner,
    notes: ["Дамасская роза", "Гиалурон", "Баланс pH"],
  },
];
