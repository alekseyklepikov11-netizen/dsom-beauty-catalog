import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import Philosophy from "@/components/Philosophy";
import Footer from "@/components/Footer";
import { categories, products, Category } from "@/data/products";

const Index = () => {
  const [active, setActive] = useState<Category>("Все");

  const filtered = useMemo(
    () => (active === "Все" ? products : products.filter((p) => p.category === active)),
    [active]
  );

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Marquee />

      <section id="catalog" className="py-24 md:py-32">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[11px] tracking-luxe uppercase text-accent mb-5">— Коллекция</p>
            <h2 className="font-display text-5xl md:text-7xl leading-[1.05] text-foreground">
              Каталог <span className="italic">ритуалов</span>
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Шесть формул, выверенных до молекулы. Выбирайте по назначению или
              просто следуйте интуиции.
            </p>
          </div>

          <CategoryFilter categories={categories} active={active} onChange={setActive} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 mt-16">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-20 italic font-display text-xl">
              В этой категории пока тихо.
            </p>
          )}
        </div>
      </section>

      <Philosophy />
      <Footer />
    </main>
  );
};

export default Index;
