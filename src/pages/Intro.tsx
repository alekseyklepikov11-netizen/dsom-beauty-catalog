/**
 * DSOM Hero Intro — отдельная встречающая страница на /intro.
 *
 * Cinematic scroll-driven landing: 15-сек AI-видео скрабится по позиции
 * скролла, поверх — 6 текстовых overlay'ев на разных фазах видео, в финале
 * флакон DSOM RENEW + CTA «Перейти в каталог».
 *
 * Концепт собран в standalone preview:
 *   C:\Users\klepi\dsom-tools\design-previews\hero-v1\index.html
 *
 * Архитектура — Apple Vision Pro паттерн:
 *   - hero-section высотой 600vh даёт scroll range
 *   - inside: sticky video + sticky text overlays
 *   - video перекодирован с keyint=1 (каждый кадр — keyframe) для
 *     frame-accurate scroll-scrubbing
 *   - бургер-меню всегда доступно для skip в нужный раздел сайта
 *
 * Видео: public/videos/hero-intro.mp4 (10.85 MB, 1344×768, 15 сек, H.264).
 * Шрифты: Fraunces / Cormorant Garamond / Cormorant SC — подгружены в index.html.
 */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Intro.css";

const Intro = () => {
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroCineRef = useRef<HTMLElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const sceneMarkerRef = useRef<HTMLDivElement>(null);
  const overlaysRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuOverlayRef = useRef<HTMLElement>(null);
  const ctaButtonRef = useRef<HTMLAnchorElement>(null);

  // Маркируем body + сохраняем дату последнего просмотра.
  // Index.tsx сравнит дату с today — если совпадают, редиректа не будет
  // (вторичный заход в течение тех же суток). Завтра — снова покажется.
  useEffect(() => {
    document.body.classList.add("intro-active");
    if (typeof window !== "undefined") {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem("dsom_intro_last_seen", today);
    }
    return () => {
      document.body.classList.remove("intro-active");
      document.body.classList.remove("intro-show-hint");
      document.body.classList.remove("intro-menu-open");
      document.body.style.backgroundColor = "";
    };
  }, []);

  // CURSOR — точка + золотой trail
  useEffect(() => {
    const canvas = cursorCanvasRef.current;
    const cursor = cursorDotRef.current;
    if (!canvas || !cursor) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let mouseX = 0;
    let mouseY = 0;
    const trail: Array<{ x: number; y: number; life: number }> = [];
    const TRAIL_MAX = 22;
    let rafId = 0;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!cursor.classList.contains("is-active")) cursor.classList.add("is-active");
      cursor.style.left = mouseX + "px";
      cursor.style.top = mouseY + "px";
      trail.push({ x: mouseX, y: mouseY, life: 1 });
      if (trail.length > TRAIL_MAX) trail.shift();
    };

    const drawTrail = () => {
      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
      if (trail.length >= 2) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#C9A572";
        for (let i = 1; i < trail.length; i++) {
          const t = i / trail.length;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.lineWidth = 2.5 * t;
          ctx.globalAlpha = 0.6 * t;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        for (let i = trail.length - 1; i >= 0; i--) {
          trail[i].life -= 0.04;
          if (trail[i].life <= 0) trail.splice(i, 1);
        }
      }
      rafId = requestAnimationFrame(drawTrail);
    };
    rafId = requestAnimationFrame(drawTrail);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // SCROLL-DRIVEN HERO — video scrubbing + overlay visibility + body bg
  useEffect(() => {
    const video = videoRef.current;
    const heroCine = heroCineRef.current;
    const progressFill = progressFillRef.current;
    const sceneMarker = sceneMarkerRef.current;
    const overlaysContainer = overlaysRef.current;
    if (!video || !heroCine || !progressFill || !sceneMarker || !overlaysContainer) return;

    const overlays = Array.from(overlaysContainer.querySelectorAll<HTMLDivElement>(".intro-overlay"));

    // На мобильных touch-устройствах scroll-scrubbing работает плохо
    // (нет колеса мыши, неточный thumb-scroll, тяжело декодировать кадры).
    // Делаем простой fallback: видео играет autoplay+loop, текст-оверлеи
    // всё равно меняются по scroll position.
    const isMobile = window.matchMedia("(max-width: 768px)").matches
                  || ("ontouchstart" in window);

    let targetTime = 0;
    let smoothTime = 0;
    let isVideoReady = false;
    let rafId = 0;

    const getProgress = () => {
      const rect = heroCine.getBoundingClientRect();
      const heroH = heroCine.offsetHeight - window.innerHeight;
      const sy = -rect.top;
      return Math.max(0, Math.min(1, sy / Math.max(1, heroH)));
    };

    const lerpColor = (c1: string, c2: string, t: number) => {
      const r = c1.match(/\w\w/g)!.map((h) => parseInt(h, 16));
      const s = c2.match(/\w\w/g)!.map((h) => parseInt(h, 16));
      return `rgb(${Math.round(r[0] + (s[0] - r[0]) * t)}, ${Math.round(r[1] + (s[1] - r[1]) * t)}, ${Math.round(r[2] + (s[2] - r[2]) * t)})`;
    };

    const update = () => {
      const p = getProgress();
      if (isVideoReady && isFinite(video.duration)) {
        targetTime = p * video.duration;
      }
      progressFill.style.height = (p * 100).toFixed(2) + "%";

      if (p < 0.7) {
        document.body.style.backgroundColor = "#0A0806";
      } else {
        const t = (p - 0.7) / 0.3;
        document.body.style.backgroundColor = lerpColor("0A0806", "F5EFE6", t);
      }

      if (p >= 0.82) heroCine.classList.add("is-finale");
      else heroCine.classList.remove("is-finale");

      let activeIdx = 0;
      overlays.forEach((ov, i) => {
        const from = parseFloat(ov.dataset.from || "0");
        const to = parseFloat(ov.dataset.to || "1");
        if (p >= from && p <= to) {
          ov.classList.add("is-visible");
          activeIdx = i;
        } else {
          ov.classList.remove("is-visible");
        }
      });
      const markVal = overlays[activeIdx]?.dataset.mark || "01";
      sceneMarker.innerHTML = `<span class="current">${markVal}</span> / 06`;

      if (p < 0.03) document.body.classList.add("intro-show-hint");
      else document.body.classList.remove("intro-show-hint");
    };

    const tick = () => {
      if (isVideoReady && isFinite(video.duration)) {
        smoothTime += (targetTime - smoothTime) * 0.18;
        video.currentTime = smoothTime;
      }
      rafId = requestAnimationFrame(tick);
    };

    const initVideo = () => {
      if (isVideoReady) return;
      isVideoReady = true;
      if (isMobile) {
        // Мобильные — просто autoplay loop, без скраббинга
        video.loop = true;
        video.muted = true;
        video.play().catch(() => {
          // если autoplay блокирован браузером — пользователь увидит постер,
          // тапнет на видео — оно начнёт играть (стандартное поведение)
        });
      } else {
        video.pause();
        update();
        smoothTime = targetTime;
        video.currentTime = smoothTime;
      }
    };

    video.addEventListener("canplaythrough", initVideo);
    video.addEventListener("loadedmetadata", initVideo);
    if (video.readyState >= 4) initVideo();

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // На мобильных tick не нужен — видео играет само
    if (!isMobile) rafId = requestAnimationFrame(tick);
    update();

    setTimeout(() => {
      if (window.scrollY < window.innerHeight * 0.03) {
        document.body.classList.add("intro-show-hint");
      }
    }, 600);

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener("canplaythrough", initVideo);
      video.removeEventListener("loadedmetadata", initVideo);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // BURGER MENU
  useEffect(() => {
    const burger = burgerRef.current;
    if (!burger) return;

    const onBurgerClick = (e: MouseEvent) => {
      e.stopPropagation();
      document.body.classList.toggle("intro-menu-open");
    };
    const onDocClick = (e: MouseEvent) => {
      if (!document.body.classList.contains("intro-menu-open")) return;
      const target = e.target as HTMLElement;
      if (target.closest(".intro-burger-toggle")) return;
      if (target.closest(".intro-menu-overlay")) return;
      document.body.classList.remove("intro-menu-open");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") document.body.classList.remove("intro-menu-open");
    };

    burger.addEventListener("click", onBurgerClick);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      burger.removeEventListener("click", onBurgerClick);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // MAGNETIC CTA + cursor enlargement on links/buttons
  useEffect(() => {
    const cursor = cursorDotRef.current;
    const btn = ctaButtonRef.current;
    if (!cursor) return;

    const enter = () => cursor.classList.add("magnetic");
    const leave = () => cursor.classList.remove("magnetic");

    const links = document.querySelectorAll<HTMLElement>(".intro-root a, .intro-root button");
    links.forEach((el) => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });

    let onBtnMove: ((e: MouseEvent) => void) | null = null;
    let onBtnLeaveReset: (() => void) | null = null;
    if (btn) {
      const range = 24;
      onBtnMove = (e: MouseEvent) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.transform = `translate(${dx * range * 0.4}px, ${dy * range * 0.4}px)`;
      };
      onBtnLeaveReset = () => {
        btn.style.transform = "translate(0,0)";
      };
      btn.addEventListener("mousemove", onBtnMove);
      btn.addEventListener("mouseleave", onBtnLeaveReset);
    }

    return () => {
      links.forEach((el) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
      if (btn && onBtnMove) btn.removeEventListener("mousemove", onBtnMove);
      if (btn && onBtnLeaveReset) btn.removeEventListener("mouseleave", onBtnLeaveReset);
    };
  }, []);

  return (
    <div className="intro-root">
      {/* Курсор */}
      <canvas ref={cursorCanvasRef} className="intro-cursor-canvas" />
      <div ref={cursorDotRef} className="intro-cursor-dot" />

      {/* Fixed UI */}
      <div className="intro-scroll-progress">
        <div className="fill" ref={progressFillRef} />
      </div>
      <div className="intro-scene-marker" ref={sceneMarkerRef}>
        <span className="current">01</span> / 06
      </div>
      <Link to="/" className="intro-brand-mark">DSOM</Link>
      <div className="intro-scroll-hint">Листайте</div>

      {/* Burger menu */}
      <button ref={burgerRef} className="intro-burger-toggle" aria-label="Меню">
        <span /> <span /> <span />
      </button>
      <nav ref={menuOverlayRef} className="intro-menu-overlay">
        <div className="menu-section">— Основное</div>
        <Link to="/">Главная</Link>
        <Link to="/catalog">Каталог</Link>
        <Link to="/quiz">Подбор ухода</Link>
        <Link to="/favorites">Избранное</Link>
        <div className="menu-section">— О бренде</div>
        <Link to="/page/about">О бренде</Link>
        <Link to="/page/philosophy">Философия</Link>
        <Link to="/page/values">Ценности</Link>
        <Link to="/page/where-to-buy">Где купить</Link>
        <div className="menu-section">— Сервис</div>
        <Link to="/page/delivery">Доставка</Link>
        <Link to="/page/care">Забота о клиентах</Link>
        <Link to="/page/contacts">Контакты</Link>
        <Link to="/page/documents">Документы</Link>

        <div className="intro-menu-footer">
          <span>hello@dsom.ru</span>
          <span>@dsom_official</span>
          <span>Старт продаж — июнь 2026</span>
        </div>
      </nav>

      {/* HERO CINEMATIC (600vh) */}
      <section ref={heroCineRef} className="intro-hero-cine">
        <div className="intro-hero-sticky">
          <video
            ref={videoRef}
            className="intro-hero-video"
            src="/videos/hero-intro.mp4"
            muted
            playsInline
            preload="auto"
          />
          <div className="intro-hero-vignette" />

          <div ref={overlaysRef}>
            {/* Сцена 1: 0 — 0.18 */}
            <div className="intro-overlay" data-from="0" data-to="0.18" data-mark="01">
              <span className="small-caps">— Derma Science Of Modernity</span>
              <h1>Формулы.</h1>
              <p className="subtitle">
                Активная косметика без маркетинговой наценки.
                <br />
                Старт продаж — июнь 2026.
              </p>
            </div>

            {/* Сцена 2: 0.18 — 0.34 */}
            <div className="intro-overlay" data-from="0.18" data-to="0.34" data-mark="02">
              <span className="small-caps">— P3 Lift</span>
              <h2 className="huge-number">
                0,1<span className="unit">%</span>
              </h2>
              <p className="lede">
                PDRN — фрагменты ДНК лосося. Молекула регенерации.
                <br />
                Та же концентрация, что в лабораторных премиум-сыворотках.
              </p>
            </div>

            {/* Сцена 3: 0.34 — 0.50 */}
            <div className="intro-overlay" data-from="0.34" data-to="0.50" data-mark="03">
              <span className="small-caps">— P2 Renew</span>
              <h2 className="huge-number">
                0,3<span className="unit">%</span>
              </h2>
              <p className="lede">
                Ретинол в осмыслённой дозировке.
                <br />
                Меньше — не работает. Больше — раздражение.
              </p>
            </div>

            {/* Сцена 4: 0.50 — 0.68 */}
            <div className="intro-overlay" data-from="0.50" data-to="0.68" data-mark="04">
              <span className="small-caps">— P1 Glow</span>
              <h2 className="huge-number">
                2000<span className="unit"> ppm</span>
              </h2>
              <p className="lede">
                Микроиглы спикул морских губок.
                <br />
                Кожа не царапается. Кожа открывается.
              </p>
            </div>

            {/* Сцена 5: 0.68 — 0.82 */}
            <div className="intro-overlay" data-from="0.68" data-to="0.82" data-mark="05">
              <h2 className="statement">
                Цена
                <br />
                не равна
                <br />
                концентрации.
              </h2>
              <p className="subtitle">
                У большинства брендов цена — это маркетинговая надбавка.
                <br />
                Мы перестали этому подыгрывать.
              </p>
            </div>

            {/* Сцена 6: 0.82 — 1.00  — ФИНАЛ */}
            <div
              className="intro-overlay is-finale"
              data-from="0.82"
              data-to="1.0"
              data-mark="06"
            >
              <div className="finale-left">
                <span className="small-caps">— DSOM Renew</span>
                <h2 className="statement">
                  Активная косметика
                  <br />
                  с прозрачным
                  <br />
                  составом.
                </h2>
              </div>
              <div className="finale-right">
                <Link
                  ref={ctaButtonRef}
                  to="/catalog"
                  className="intro-cta-button"
                >
                  <span>Перейти в каталог</span>
                  <span className="arrow" />
                </Link>
                <span className="intro-cta-meta">
                  — Старт продаж · Июнь 2026 · Ozon
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="intro-colophon">
        DSOM · ООО «ВАЛКЭНДВИР» · ИНН 9707045838 · Произведено: Российская Федерация
      </footer>
    </div>
  );
};

export default Intro;
