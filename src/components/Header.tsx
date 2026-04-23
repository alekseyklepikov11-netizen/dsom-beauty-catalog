const Header = () => {
  return (
    <header className="absolute top-0 inset-x-0 z-30">
      <div className="container flex items-center justify-between py-7">
        <a href="#" className="font-display text-2xl tracking-[0.4em] text-foreground">
          DSOM
        </a>
        <nav className="hidden md:flex items-center gap-10 text-[11px] tracking-luxe uppercase">
          <a href="#catalog" className="hover:text-accent transition-colors">Каталог</a>
          <a href="#philosophy" className="hover:text-accent transition-colors">Философия</a>
          <a href="#journal" className="hover:text-accent transition-colors">Журнал</a>
          <a href="#contact" className="hover:text-accent transition-colors">Контакты</a>
        </nav>
        <div className="flex items-center gap-6 text-[11px] tracking-luxe uppercase">
          <button className="hover:text-accent transition-colors hidden sm:block">Поиск</button>
          <button className="hover:text-accent transition-colors">
            Корзина <span className="text-muted-foreground">(0)</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
