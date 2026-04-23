import philosophy from "@/assets/philosophy.jpg";

const Philosophy = () => {
  return (
    <section id="philosophy" className="py-28 md:py-40 bg-secondary/40">
      <div className="container grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={philosophy}
            alt="Философия DSOM"
            loading="lazy"
            width={1200}
            height={1400}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-md">
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-6">— Философия</p>
          <h2 className="font-display text-5xl md:text-6xl leading-[1.05] text-foreground">
            Меньше шума.<br />
            <span className="italic">Больше смысла.</span>
          </h2>
          <p className="mt-8 text-base leading-relaxed text-muted-foreground">
            Мы создаём средства, которые не требуют пояснений. Холодный отжим,
            ботанические экстракты Прованса, биотехнологии — соединённые с уважением
            к коже и времени.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Без парабенов, силиконов, синтетических ароматизаторов. Только то,
            что действительно работает.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 pt-8 border-t border-border">
            <div>
              <p className="font-display text-3xl text-foreground">94%</p>
              <p className="text-[11px] tracking-luxe uppercase text-muted-foreground mt-2">Натуральных ингредиентов</p>
            </div>
            <div>
              <p className="font-display text-3xl text-foreground">12</p>
              <p className="text-[11px] tracking-luxe uppercase text-muted-foreground mt-2">Активных формул</p>
            </div>
            <div>
              <p className="font-display text-3xl text-foreground">0</p>
              <p className="text-[11px] tracking-luxe uppercase text-muted-foreground mt-2">Тестов на животных</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;
