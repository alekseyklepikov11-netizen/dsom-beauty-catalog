import { useState } from "react";
import { toast } from "sonner";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Спасибо, мы на связи.", {
      description: "Подтверждение отправлено на " + email,
    });
    setEmail("");
  };

  return (
    <footer id="contact" className="bg-foreground text-background pt-24 pb-10">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 pb-20 border-b border-background/15">
          <div>
            <h2 className="font-display text-5xl md:text-6xl leading-[1.05]">
              Войдите в <span className="italic">круг</span> DSOM.
            </h2>
            <p className="mt-6 text-background/60 max-w-md text-sm leading-relaxed">
              Письма раз в месяц: новые формулы, ритуалы и тихие мысли о красоте.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col justify-end">
            <label className="text-[11px] tracking-luxe uppercase text-background/60 mb-3">Электронная почта</label>
            <div className="flex border-b border-background/30 focus-within:border-background transition-colors">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="flex-1 bg-transparent py-3 outline-none placeholder:text-background/30 text-background"
              />
              <button
                type="submit"
                className="text-[11px] tracking-luxe uppercase px-4 hover:text-accent transition-colors"
              >
                Подписаться →
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 py-16">
          <div>
            <p className="font-display text-3xl tracking-[0.3em] mb-6">DSOM</p>
            <p className="text-xs text-background/50 leading-relaxed">
              Эссенциальный уход.<br />Париж · Москва.
            </p>
          </div>
          <div>
            <p className="text-[11px] tracking-luxe uppercase text-background/50 mb-5">Магазин</p>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-accent transition-colors">Сыворотки</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Кремы</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Очищение</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Защита</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] tracking-luxe uppercase text-background/50 mb-5">Дом</p>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-accent transition-colors">О бренде</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Журнал</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Бутики</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Карьера</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] tracking-luxe uppercase text-background/50 mb-5">Связь</p>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-accent transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Telegram</a></li>
              <li><a href="mailto:bonjour@dsom.com" className="hover:text-accent transition-colors">bonjour@dsom.com</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-10 border-t border-background/15 text-[11px] tracking-luxe uppercase text-background/40">
          <p>© 2024 DSOM. Все права защищены.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-background transition-colors">Cookies</a>
            <a href="#" className="hover:text-background transition-colors">Политика</a>
            <a href="#" className="hover:text-background transition-colors">Условия</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
