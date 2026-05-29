// ============================================================
// HeroBanner.tsx — единый компонент для рендера hero-баннера.
// ============================================================
// Используется на главной (variant=fullscreen) и каталоге/о бренде (variant=section).
// Внутри: 4 состояния рендера в зависимости от state из useBanner.
//
// КРИТИЧНО: state=loading рендерится как тёмный skeleton, НЕ как fallback-текст.
// Это устраняет FOOC «Активная косметика» при загрузке /.
// ============================================================

import type { ReactNode } from "react";
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
  /** Дополнительный класс на корневой section (для border-b и т.п.). */
  className?: string;
}

const HEIGHT_CLASSES: Record<HeroBannerProps["variant"], string> = {
  fullscreen: "min-h-[100vh]",
  section: "h-[55vh] min-h-[420px] max-h-[680px]",
};

export function HeroBanner(props: HeroBannerProps) {
  const { state, variant } = props;
  // viewport-фильтрация баннеров теперь в useBanner — каждый баннер пришёл уже
  // для своего viewport (variant=desktop или variant=mobile). HeroBanner просто
  // рендерит то что получил.

  // Лог ошибок для debug, но render всё равно показывает fallback
  if (state.status === "error") {
    console.error(`HeroBanner load failed: ${state.error}`);
  }

  // Loading skeleton — тёмный bg без текста (фикс FOOC)
  if (state.status === "loading") {
    return (
      <section
        className={`relative ${HEIGHT_CLASSES[variant]} bg-[#0a0a0a] overflow-hidden ${props.className || ""}`}
        aria-busy="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#0a0a0a] animate-pulse" />
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
      className={`relative ${HEIGHT_CLASSES[variant]} flex overflow-hidden bg-[#0a0a0a] ${posClass} ${props.className || ""}`}
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
            style={{ objectPosition: focalPoint }}
            className="absolute inset-0 w-full h-full object-cover"
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
            style={{ objectPosition: focalPoint }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null
      ) : banner?.image_url ? (
        <img
          src={banner.image_url}
          srcSet={srcset}
          sizes="100vw"
          alt={altText}
          loading="eager"
          fetchPriority="high"
          style={{ objectPosition: focalPoint }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}

      {/* Виньетка-градиент под зону текста */}
      <div className={`absolute inset-0 ${gradientClass} pointer-events-none`} />

      {/* Text container — позиционирован через POS_CLASSES на parent flex */}
      <div
        className={`relative px-6 md:px-12 lg:px-20 ${variant === "fullscreen" ? "pt-32 pb-20" : "py-12 md:py-16 lg:py-20"} max-w-2xl lg:max-w-3xl w-full animate-fade-up`}
      >
        {props.eyebrow && (
          <p className="font-barlow font-medium text-[12px] tracking-[0.3em] uppercase text-white/80 mb-8">
            {props.eyebrow}
          </p>
        )}

        <TitleRender title={title} variant={variant} />

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
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-barlow text-[10px] tracking-[0.3em] uppercase text-white/60">
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
}

/**
 * Рендер заголовка с поддержкой двухстрочной типографики:
 * - Если title содержит «|», левая часть — sans-serif, правая — italic serif (2 строки)
 * - Иначе — одна строка с font зависящим от variant
 */
function TitleRender({ title, variant }: TitleProps) {
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
    <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[1.0] text-white">
      {title}
    </h1>
  );
}
