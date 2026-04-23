import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const NotFound = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <SEO title={lang === "en" ? "Page not found" : "Страница не найдена"} />
      <Header />

      <section className="flex-1 grid place-items-center container py-24">
        <div className="text-center max-w-xl">
          <p className="font-display text-[140px] md:text-[200px] leading-none text-accent">404</p>
          <h1 className="font-display text-4xl md:text-5xl mt-4">
            {lang === "en" ? "This page slipped away" : "Эта страница ускользнула"}
          </h1>
          <p className="text-muted-foreground mt-6 leading-relaxed">
            {lang === "en"
              ? "The page you're looking for doesn't exist or has been moved. Try the catalog or return home."
              : "Страница, которую вы ищете, не существует или была перемещена. Загляните в каталог или вернитесь на главную."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-10">
            <Link
              to="/"
              className="bg-foreground text-background px-6 py-3 text-[11px] tracking-luxe uppercase hover:bg-foreground/90 transition-colors"
            >
              {lang === "en" ? "Home" : "На главную"}
            </Link>
            <Link
              to="/catalog"
              className="border border-foreground text-foreground px-6 py-3 text-[11px] tracking-luxe uppercase hover:bg-foreground hover:text-background transition-colors"
            >
              {lang === "en" ? "Open catalog" : "Открыть каталог"}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default NotFound;
