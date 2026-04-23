const marqueeWords = [
  "Чистая формула",
  "Без сульфатов",
  "Сделано во Франции",
  "Cruelty Free",
  "Биоразлагаемая упаковка",
  "Холодный отжим",
];

const Marquee = () => {
  const items = [...marqueeWords, ...marqueeWords];
  return (
    <div className="border-y border-border py-5 overflow-hidden bg-background">
      <div className="flex gap-12 animate-marquee whitespace-nowrap">
        {items.map((w, i) => (
          <span key={i} className="text-[11px] tracking-luxe uppercase text-muted-foreground flex items-center gap-12">
            {w}
            <span className="text-accent">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
