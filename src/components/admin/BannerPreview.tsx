// ============================================================
// BannerPreview.tsx — рендер баннера КАК ВИДИТ ПОСЕТИТЕЛЬ.
// ============================================================
// Картинка (object-cover + focal) + градиент-виньетка + текст
// (eyebrow / заголовок / подзаголовок) в нужной 9-зонной позиции,
// внутри рамки устройства (desktop 16:9 / mobile ~9:19.5 = реальный
// кроп телефона). Типографика и отступы на cqw — масштабируются к рамке
// так же, как реальный hero к вьюпорту, поэтому превью ≈ боевой вид 1:1.
//
// ВАЖНО: для главной (variant="fullscreen") дополнительно рисуем CTA-кнопки
// («Получить промокод» + «Посмотреть формулы») и scroll-cue «ЛИСТАЙТЕ ↓»,
// потому что на боевом сайте они стоят ПОД текстом и выталкивают его вверх.
// Без них превью показывало бы текст ниже, чем в реальности (баг рассинхрона).
//
// Зеркалит overlay-логику HeroBanner.tsx.
// ============================================================

import { POS_CLASSES, POS_GRADIENT, DEFAULT_POS, DEFAULT_FOCAL_POINT, isValidPos } from "@/lib/banner-positions";

export type PreviewDevice = "desktop" | "mobile";
export type PreviewVariant = "fullscreen" | "section";

interface BannerPreviewProps {
  imageUrl: string | null;
  videoUrl?: string | null;
  title: string;
  subtitle?: string | null;
  eyebrow?: string;
  textPosition?: string | null;
  focalPoint?: string | null;
  device: PreviewDevice;
  /** fullscreen = главная (с CTA + scroll-cue), section = каталог/о-бренде. */
  variant?: PreviewVariant;
}

// Пропорции рамки = реальные пропорции вьюпорта устройства.
const FRAME_AR: Record<PreviewDevice, string> = {
  desktop: "16 / 9",
  mobile: "390 / 844",
};

// Размеры в cqw — % от ширины рамки. Подобраны так, чтобы повторить реальный
// hero после применения clamp() на каждом устройстве.
const F: Record<PreviewDevice, {
  eyebrow: string; title: string; titleSerif: string; subtitle: string;
  cta: string; cue: string; gap: string; padX: string; padTop: string; padBottom: string;
}> = {
  desktop: { eyebrow: "1.4cqw", title: "6.5cqw", titleSerif: "8cqw", subtitle: "2cqw", cta: "1.6cqw", cue: "1.2cqw", gap: "2.2cqw", padX: "5cqw", padTop: "10cqw", padBottom: "7cqw" },
  mobile:  { eyebrow: "3cqw",   title: "10cqw",  titleSerif: "12cqw", subtitle: "3.6cqw", cta: "3.2cqw", cue: "2.4cqw", gap: "3cqw", padX: "6cqw", padTop: "9cqw", padBottom: "9cqw" },
};

export default function BannerPreview(props: BannerPreviewProps) {
  const { imageUrl, videoUrl, title, subtitle, eyebrow, textPosition, focalPoint, device } = props;
  const variant = props.variant || "section";
  const isFull = variant === "fullscreen";
  const pos = textPosition && isValidPos(textPosition) ? textPosition : DEFAULT_POS;
  const focal = focalPoint || DEFAULT_FOCAL_POINT;
  const f = F[device];

  // Заголовок с поддержкой "|" — как TitleRender в HeroBanner.
  const splitIdx = title.indexOf("|");
  const hasSplit = splitIdx > 0;
  const line1 = hasSplit ? title.slice(0, splitIdx).trim() : title;
  const line2 = hasSplit ? title.slice(splitIdx + 1).trim() : "";

  const frameStyle: React.CSSProperties = {
    aspectRatio: FRAME_AR[device],
    containerType: "inline-size",
    ...(device === "mobile" ? { maxWidth: 240, marginLeft: "auto", marginRight: "auto" } : {}),
  };

  const innerStyle: React.CSSProperties = {
    paddingLeft: f.padX,
    paddingRight: f.padX,
    paddingTop: f.padTop,
    paddingBottom: f.padBottom,
    maxWidth: "100%",
    width: "100%",
  };

  return (
    <div style={frameStyle} className="relative w-full overflow-hidden bg-[#0a0a0a] rounded-lg">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          style={{ objectPosition: focal }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-white/30 text-xs">нет картинки</div>
      )}

      {/* Виньетка под зону текста — те же градиенты, что на сайте */}
      <div className={`absolute inset-0 ${POS_GRADIENT[pos]} pointer-events-none`} />

      {/* Текст-контейнер в нужной 9-зонной позиции */}
      <div className={`absolute inset-0 flex ${POS_CLASSES[pos]}`}>
        <div style={innerStyle}>
          {eyebrow && (
            <p
              style={{ fontSize: f.eyebrow, letterSpacing: "0.3em", marginBottom: f.gap }}
              className="font-barlow font-medium uppercase text-white/80"
            >
              {eyebrow}
            </p>
          )}

          {hasSplit ? (
            <h3 className="text-white">
              <span style={{ fontSize: f.title }} className="block font-barlow font-medium leading-[1] tracking-[-0.04em]">{line1}</span>
              <span style={{ fontSize: f.titleSerif }} className="block font-serif italic leading-[1.05]">{line2}</span>
            </h3>
          ) : (
            <h3
              style={{ fontSize: f.title }}
              className="text-white font-barlow font-medium leading-[1.05] tracking-[-0.04em]"
            >
              {title}
            </h3>
          )}

          {subtitle && (
            <p
              style={{ fontSize: f.subtitle, marginTop: f.gap }}
              className="font-barlow font-medium text-white/85 leading-snug"
            >
              {subtitle}
            </p>
          )}

          {/* CTA-кнопки — только на главной (выталкивают текст вверх, как в бою) */}
          {isFull && (
            <div
              style={{ marginTop: f.gap, gap: f.gap }}
              className="flex flex-wrap items-center justify-center"
            >
              <span
                style={{ fontSize: f.cta, paddingTop: "1.4cqw", paddingBottom: "1.4cqw", paddingLeft: "3cqw", paddingRight: "3cqw" }}
                className="rounded-full bg-white text-black font-barlow font-medium whitespace-nowrap"
              >
                ▸ Получить промокод 10%
              </span>
              <span
                style={{ fontSize: f.cta, paddingTop: "1.4cqw", paddingBottom: "1.4cqw", paddingLeft: "3cqw", paddingRight: "3cqw" }}
                className="rounded-full border border-white/45 text-white font-barlow font-medium whitespace-nowrap"
              >
                Посмотреть формулы
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scroll-cue внизу — только на главной */}
      {isFull && (
        <div
          style={{ fontSize: f.cue, letterSpacing: "0.3em", bottom: "3cqw" }}
          className="absolute left-1/2 -translate-x-1/2 font-barlow uppercase text-white/60"
        >
          Листайте ↓
        </div>
      )}

      {videoUrl && (
        <span className="absolute top-2 right-2 z-10 bg-foreground/80 text-background text-[9px] px-1.5 py-0.5 rounded tracking-luxe uppercase">Видео</span>
      )}
    </div>
  );
}
