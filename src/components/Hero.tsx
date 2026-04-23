import hero from "@/assets/hero.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden grain">
      <img
        src={hero}
        alt="Уходовая косметика DSOM"
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/20" />

      <div className="relative container pb-20 md:pb-28 pt-40">
        <div className="max-w-3xl animate-fade-up">
          <p className="text-[11px] tracking-luxe uppercase text-muted-foreground mb-6">
            Эссенция · Est. 2024 · Париж — Москва
          </p>
          <h1 className="font-display text-[clamp(3rem,9vw,8.5rem)] leading-[0.95] text-foreground">
            Уход,<br />
            <span className="italic text-accent">воплощённый</span><br />
            в ритуал.
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
            DSOM — формулы чистого происхождения. Минимум ингредиентов,
            максимум смысла. Каждое средство — медленная пауза в потоке дня.
          </p>
          <div className="mt-10 flex items-center gap-8">
            <a
              href="#catalog"
              className="group inline-flex items-center gap-3 text-[11px] tracking-luxe uppercase text-foreground"
            >
              <span className="relative">
                Открыть коллекцию
                <span className="absolute left-0 -bottom-1 h-px w-full bg-foreground origin-left transition-transform duration-500 group-hover:scale-x-0" />
              </span>
              <span className="transition-transform duration-500 group-hover:translate-x-2">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
