// ============================================================
// HeroBanner.tsx — единый компонент для рендера hero-баннера.
// ============================================================
// Используется на главной (variant=fullscreen) и каталоге/о бренде (variant=section).
// Внутри: 4 состояния рендера в зависимости от state из useBanner.
//
// КРИТИЧНО: state=loading рендерится как тёмный skeleton, НЕ как fallback-текст.
// Это устраняет FOOC «Активная косметика» при загрузке /.
// ============================================================

import { useEffect, useState, type ReactNode } from "react";
import type { BannerState } from "@/hooks/useBanner";
import {
  POS_CLASSES,
  POS_GRADIENT,
  POS_CTA_JUSTIFY,
  DEFAULT_POS,
  DEFAULT_FOCAL_POINT,
  isValidPos,
} from "@/lib/banner-positions";

export interface HeroBannerProps {
  /** Discriminated state из useBanner(position). */
  state: BannerState;
  /** Layout: fullscreen = main page (100vh + video), section = catalog/about (55vh + img). */
  variant: "fullscreen" | "section";
  /** Показывается ТОЛЬКО если ready + banner=null (нет активного баннера для позиции). */
  fallbackTitle: string;
  fallbackSubtitle?: string;
  /** Video URL для fullscreen-фолбэка (когда нет banner.video_url). */
  fallbackVideo?: string;
  /** «— DSOM · ЛАБОРАТОРИЯ УХОДА» style chip над заголовком. */
  eyebrow?: string;
  /** Render-prop для CTAs — получает banner для click-tracking. */
  cta?: ReactNode;
  /** Scroll cue ↓ в нижней части (для fullscreen). */
  showScrollCue?: boolean;
  scrollCueLabel?: string;
  /** Видео для section-варианта: проигрывается один раз без звука и остаётся на последнем кадре.
   *  При prefers-reduced-motion сразу показывается последний кадр. Приоритет над картинкой баннера. */
  introVideo?: { mp4: string; webm?: string; poster: string; endFrame: string; alt: string };
  /** Дополнительный класс на корневой section (для border-b и т.п.). */
  className?: string;
}

const HEIGHT_CLASSES: Record<HeroBannerProps["variant"], string> = {
  fullscreen: "min-h-[100vh]",
  section: "h-[55vh] min-h-[420px] max-h-[680px]",
};

// ── Резерв места под картинку баннера на телефоне (CLS) ──
// На мобильном картинка идёт «в поток» (h-auto), и пока она не загрузилась, её высота = 0 —
// блок под баннером потом прыгает вниз. Резервируем высоту через `aspect-ratio: auto <запасная>`:
// до загрузки браузер берёт запасную пропорцию, после — натуральную (внешний вид баннера прежний).
// Запасные пропорции по варианту: главная — вертикальные 3:4, каталог — горизонтальные 16:9.
const MOBILE_FALLBACK_RATIO: Record<HeroBannerProps["variant"], number> = {
  fullscreen: 3 / 4,
  section: 16 / 9,
};
// Примерная высота текстовой панели под картинкой на телефоне (замер 390px: главная 369–411, каталог 244).
const MOBILE_TEXT_PANEL: Record<HeroBannerProps["variant"], string> = {
  fullscreen: "h-[390px]",
  section: "h-[244px]",
};

// Выученные натуральные пропорции картинок (url → ширина/высота): со второго визита резерв точный.
const RATIO_CACHE_KEY = "dsom:banner-ratio:v1";
function readRatioCache(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(RATIO_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function rememberRatio(url: string | null | undefined, w: number, h: number) {
  if (!url || !w || !h) return;
  try {
    const cache = readRatioCache();
    const ratio = Math.round((w / h) * 10000) / 10000;
    if (cache[url] === ratio) return;
    cache[url] = ratio;
    const keys = Object.keys(cache);
    if (keys.length > 40) delete cache[keys[0]];
    window.localStorage.setItem(RATIO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // приватный режим / нет доступа к хранилищу — просто без кэша
  }
}
function mobileAspectStyle(url: string | null | undefined, variant: HeroBannerProps["variant"]) {
  const known = url ? readRatioCache()[url] : undefined;
  const ratio = typeof known === "number" && Number.isFinite(known) && known > 0 ? known : MOBILE_FALLBACK_RATIO[variant];
  // На десктопе у img/video заданы и ширина, и высота (absolute inset-0) — aspect-ratio там не действует.
  return { aspectRatio: `auto ${ratio}` };
}

/** Экономия трафика (Data Saver) — не запускать тяжёлое видео. */
function prefersSaveData(): boolean {
  try {
    return !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  } catch {
    return false;
  }
}

/** Видео, которое проигрывается один раз и останавливается на последнем кадре (браузер сам держит его на экране). */
function PlayOnceVideo({ mp4, webm, poster, endFrame, alt }: NonNullable<HeroBannerProps["introVideo"]>) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    // При reduced-motion или включённой экономии трафика — сразу последний кадр, без видео.
    setReduced(!!mq?.matches || prefersSaveData());
  }, []);
  if (reduced) {
    return <img src={endFrame} alt={alt} loading="eager" className="absolute inset-0 w-full h-full object-cover" />;
  }
  return (
    <video
      autoPlay
      muted
      playsInline
      preload="metadata"
      poster={poster}
      aria-label={alt}
      className="absolute inset-0 w-full h-full object-cover"
    >
      {webm && <source src={webm} type="video/webm" />}
      <source src={mp4} type="video/mp4" />
    </video>
  );
}

export function HeroBanner(props: HeroBannerProps) {
  const { state, variant } = props;
  // viewport-фильтрация баннеров теперь в useBanner — каждый баннер пришёл уже
  // для своего viewport (variant=desktop или variant=mobile). HeroBanner просто
  // рендерит то что получил.

  // Лог ошибок для debug, но render всё равно показывает fallback
  if (state.status === "error") {
    console.error(`HeroBanner load failed: ${state.error}`);
  }

  // Баннер с видео (страница «О бренде»): продукт стоит в центре кадра, поэтому текст не кладём поверх него
  // и не обрезаем кадр. Телефон — видео сверху, текст под ним. Компьютер — текст колонкой слева,
  // видео справа в родных пропорциях 16:9 (флакон целиком, без обрезки сверху и снизу).
  // Рендерится и в состоянии loading (видео от баннера не зависит): та же вёрстка, вместо текста —
  // пустая панель той же высоты, поэтому видео не перезапускается, а блоки ниже не прыгают.
  if (props.introVideo && variant === "section") {
    const loading = state.status === "loading";
    const introBanner = state.status === "ready" ? state.banner : null;
    const introTitle = introBanner?.title || props.fallbackTitle;
    const introSubtitle = introBanner?.subtitle || props.fallbackSubtitle;
    return (
      <section
        className={`relative bg-[#0a0a0a] overflow-hidden md:grid md:grid-cols-[38%_62%] md:items-center ${props.className || ""}`}
        aria-busy={loading || undefined}
      >
        <div className="relative h-[58vh] min-h-[340px] max-h-[560px] md:order-2 md:h-auto md:min-h-0 md:max-h-none md:aspect-video">
          <PlayOnceVideo {...props.introVideo} />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent md:hidden pointer-events-none" />
          <div className="hidden md:block absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none" />
        </div>
        {loading ? (
          <div className="relative md:order-1 w-full h-[200px] md:h-[386px]" aria-hidden="true" />
        ) : (
          <div className="relative md:order-1 px-6 pt-2 pb-12 md:px-10 lg:px-16 xl:px-20 md:py-16 w-full animate-fade-up">
            {props.eyebrow && (
              <p className="font-barlow font-medium text-[12px] tracking-[0.3em] uppercase text-white/80 mb-6 md:mb-8">
                {props.eyebrow}
              </p>
            )}
            <TitleRender title={introTitle} variant={variant} compact />
            {introSubtitle && (
              <p className="mt-5 md:mt-8 font-barlow font-medium text-sm md:text-base lg:text-lg text-white/85 leading-relaxed">
                {introSubtitle}
              </p>
            )}
            {props.cta && <div className="mt-8 md:mt-10 flex flex-wrap items-center gap-3">{props.cta}</div>}
          </div>
        )}
      </section>
    );
  }

  // Loading skeleton — тёмный bg без текста (фикс FOOC).
  // На телефоне высота скелетона = высоте готового баннера (отступ под шапку + картинка + текстовая панель),
  // а не 100vh — иначе при появлении баннера блоки ниже прыгают (CLS).
  if (state.status === "loading") {
    return (
      <section
        className={`relative ${HEIGHT_CLASSES[variant]} bg-[#0a0a0a] overflow-hidden max-md:!h-auto max-md:!min-h-0 max-md:!max-h-none ${props.className || ""}`}
        aria-busy="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#0a0a0a] animate-pulse" />
        <div className="md:hidden" aria-hidden="true">
          {variant === "fullscreen" && <div className="h-[84px]" />}
          <div className="w-full max-h-[64vh]" style={{ aspectRatio: String(MOBILE_FALLBACK_RATIO[variant]) }} />
          <div className={MOBILE_TEXT_PANEL[variant]} />
        </div>
      </section>
    );
  }

  // ready или error — рендерим контент (с banner или fallback)
  const banner = state.status === "ready" ? state.banner : null;
  // Text position приходит уже правильным для viewport (useBanner отфильтровал
  // нужный variant). Просто берём text_position из банера.
  const pos = banner?.text_position && isValidPos(banner.text_position)
    ? banner.text_position
    : DEFAULT_POS;
  const posClass = POS_CLASSES[pos];
  const gradientClass = POS_GRADIENT[pos];
  const ctaJustify = POS_CTA_JUSTIFY[pos];
  const focalPoint = banner?.image_focal_point || DEFAULT_FOCAL_POINT;

  const title = banner?.title || props.fallbackTitle;
  const subtitle = banner?.subtitle || props.fallbackSubtitle;
  const altText = banner?.title || props.fallbackTitle;

  // Видео-source: banner.video_url имеет приоритет, fallback для fullscreen
  const videoSrc = banner?.video_url || (variant === "fullscreen" ? props.fallbackVideo : undefined);

  // srcset для адаптивных WebP — 768/1280/1920w. Mobile-variant баннеры
  // используют те же ключи (но содержат mobile-композиции внутри).
  const srcset = banner?.image_srcset ? buildSrcset(banner.image_srcset) : undefined;

  return (
    <section
      className={`relative ${HEIGHT_CLASSES[variant]} flex overflow-hidden bg-[#0a0a0a] ${posClass} ${variant === "fullscreen" ? "max-md:pt-[84px]" : ""} max-md:!flex-col max-md:!items-stretch max-md:!justify-start max-md:!h-auto max-md:!min-h-0 max-md:!max-h-none ${props.className || ""}`}
    >
      {/* Background media: video для fullscreen, image для section */}
      {variant === "fullscreen" ? (
        videoSrc ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={banner?.image_url || undefined}
            style={{ objectPosition: focalPoint, ...mobileAspectStyle(videoSrc, variant) }}
            onLoadedMetadata={(e) => rememberRatio(videoSrc, e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
            className="absolute inset-0 w-full h-full object-cover max-md:!relative max-md:!inset-auto max-md:!h-auto max-md:max-h-[64vh] max-md:!object-top max-md:[mask-image:linear-gradient(to_bottom,black_76%,transparent)]"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : banner?.image_url ? (
          <img
            src={banner.image_url}
            srcSet={srcset}
            sizes="100vw"
            alt={altText}
            loading="eager"
            fetchPriority="high"
            style={{ objectPosition: focalPoint, ...mobileAspectStyle(banner.image_url, variant) }}
            onLoad={(e) => rememberRatio(banner.image_url, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
            className="absolute inset-0 w-full h-full object-cover max-md:!relative max-md:!inset-auto max-md:!h-auto max-md:max-h-[64vh] max-md:!object-top max-md:[mask-image:linear-gradient(to_bottom,black_76%,transparent)]"
          />
        ) : null
      ) : props.introVideo ? (
        <PlayOnceVideo {...props.introVideo} />
      ) : banner?.image_url ? (
        <img
          src={banner.image_url}
          srcSet={srcset}
          sizes="100vw"
          alt={altText}
          loading="eager"
          fetchPriority="high"
          style={{ objectPosition: focalPoint, ...mobileAspectStyle(banner.image_url, variant) }}
          onLoad={(e) => rememberRatio(banner.image_url, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
          className="absolute inset-0 w-full h-full object-cover max-md:!relative max-md:!inset-auto max-md:!h-auto max-md:max-h-[64vh] max-md:!object-top max-md:[mask-image:linear-gradient(to_bottom,black_76%,transparent)]"
        />
      ) : null}

      {/* Виньетка-градиент под зону текста */}
      <div className={`absolute inset-0 ${gradientClass} pointer-events-none max-md:hidden`} />

      {/* Text container — позиционирован через POS_CLASSES на parent flex */}
      <div
        className={`relative px-6 md:px-12 lg:px-20 ${variant === "fullscreen" ? "pt-32 pb-20" : "py-12 md:py-16 lg:py-20"} max-md:!pt-3 max-md:!pb-10 ${variant === "section" ? "max-w-2xl md:max-w-[46%] lg:max-w-[42%] xl:max-w-[38%]" : "max-w-2xl lg:max-w-3xl"} w-full animate-fade-up`}
      >
        {props.eyebrow && (
          <p className="font-barlow font-medium text-[12px] tracking-[0.3em] uppercase text-white/80 mb-8">
            {props.eyebrow}
          </p>
        )}

        <TitleRender title={title} variant={variant} compact={variant === "section"} />

        {subtitle && (
          <p
            className={`mt-6 md:mt-8 font-barlow font-medium text-sm md:text-base lg:text-lg text-white/85 leading-relaxed ${variant === "section" ? "max-w-2xl" : ""}`}
          >
            {subtitle}
          </p>
        )}

        {props.cta && (
          <div className={`mt-10 flex flex-wrap items-center gap-3 ${ctaJustify}`}>
            {props.cta}
          </div>
        )}
      </div>

      {/* Scroll cue (только для fullscreen) */}
      {props.showScrollCue && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-barlow text-[10px] tracking-[0.3em] uppercase text-white/60 max-md:hidden">
          {props.scrollCueLabel || "Scroll"} ↓
        </div>
      )}
    </section>
  );
}

// ============================================================
// helpers
// ============================================================

function buildSrcset(srcset: Record<string, string>): string | undefined {
  const entries = [
    srcset["768w"] && `${srcset["768w"]} 768w`,
    srcset["1280w"] && `${srcset["1280w"]} 1280w`,
    srcset["1920w"] && `${srcset["1920w"]} 1920w`,
  ].filter(Boolean);
  return entries.length > 0 ? entries.join(", ") : undefined;
}

interface TitleProps {
  title: string;
  variant: "fullscreen" | "section";
  /** Меньший кегль, когда под текстом видео с продуктом по центру кадра. */
  compact?: boolean;
}

/**
 * Рендер заголовка с поддержкой двухстрочной типографики:
 * - Если title содержит «|», левая часть — sans-serif, правая — italic serif (2 строки)
 * - Иначе — одна строка с font зависящим от variant
 */
function TitleRender({ title, variant, compact }: TitleProps) {
  const splitIdx = title.indexOf("|");
  if (splitIdx > 0) {
    const line1 = title.slice(0, splitIdx).trim();
    const line2 = title.slice(splitIdx + 1).trim();
    return (
      <h1 className="text-white">
        <span className="block font-barlow font-medium text-[clamp(2.5rem,6vw,5rem)] leading-[1] tracking-[-0.04em]">
          {line1}
        </span>
        <span className="block font-serif italic text-[clamp(3rem,7vw,6rem)] leading-[1.05] -mt-1 md:-mt-2">
          {line2}
        </span>
      </h1>
    );
  }
  if (variant === "fullscreen") {
    return (
      <h1 className="text-white font-barlow font-medium text-[clamp(2.5rem,6vw,5rem)] leading-[1.05] tracking-[-0.04em]">
        {title}
      </h1>
    );
  }
  // section variant — display font (для catalog/about)
  return (
    <h1 className={`font-display ${compact ? "text-4xl md:text-5xl xl:text-6xl" : "text-4xl md:text-6xl lg:text-7xl"} leading-[1.0] text-white`}>
      {title}
    </h1>
  );
}
