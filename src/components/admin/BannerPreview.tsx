// ============================================================
// BannerPreview.tsx — рендер баннера КАК ВИДИТ ПОСЕТИТЕЛЬ.
// ============================================================
// Картинка (object-cover + focal) + градиент-виньетка + текст
// (eyebrow / заголовок / подзаголовок) в нужной 9-зонной позиции,
// внутри рамки устройства (desktop 16:9 / mobile ~9:19.5 = реальный
// кроп телефона). Типографика на cqw — масштабируется к рамке так же,
// как реальный hero к вьюпорту, поэтому превью ≈ боевой вид 1:1.
//
// Зеркалит overlay-логику HeroBanner.tsx, но aspect-driven (а не 100vh),
// чтобы помещаться в карточку админки.
// ============================================================

import { POS_CLASSES, POS_GRADIENT, DEFAULT_POS, DEFAULT_FOCAL_POINT, isValidPos } from "@/lib/banner-positions";

export type PreviewDevice = "desktop" | "mobile";

interface BannerPreviewProps {
  imageUrl: string | null;
  videoUrl?: string | null;
  title: string;
  subtitle?: string | null;
  eyebrow?: string;
  textPosition?: string | null;
  focalPoint?: string | null;
  device: PreviewDevice;
}

// Пропорции рамки = реальные пропорции вьюпорта устройства.
const FRAME_AR: Record<PreviewDevice, string> = {
  desktop: "16 / 9",
  mobile: "390 / 844",
};

// cqw-размеры шрифта подобраны так, чтобы повторить clamp() реального hero
// после применения min/max на каждом устройстве (на телефоне заголовок
// упирается в floor 2.5rem → пропорционально крупнее, чем на десктопе).
const FONT: Record<PreviewDevice, { eyebrow: string; title: string; titleSerif: string; subtitle: string; pad: string; gap: string }> = {
  desktop: { eyebrow: "1.4cqw", title: "6.5cqw", titleSerif: "8cqw", subtitle: "2cqw", pad: "4cqw", gap: "2.2cqw" },
  mobile:  { eyebrow: "3cqw",   title: "10cqw",  titleSerif: "12cqw", subtitle: "3.6cqw", pad: "6cqw", gap: "3cqw" },
};

export default function BannerPreview(props: BannerPreviewProps) {
  const { imageUrl, videoUrl, title, subtitle, eyebrow, textPosition, focalPoint, device } = props;
  const pos = textPosition && isValidPos(textPosition) ? textPosition : DEFAULT_POS;
  const focal = focalPoint || DEFAULT_FOCAL_POINT;
  const f = FONT[device];

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

  return (
    <div style={frameStyle} className="relative w-full overflow-hidden bg-[#0a0a0a] rounded-lg">
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          style={{ objectPosition: focal }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {!imageUrl && (
        <div className="absolute inset-0 grid place-items-center text-white/30 text-xs">нет картинки</div>
      )}

      {/* Виньетка под зону текста — те же градиенты, что на сайте */}
      <div className={`absolute inset-0 ${POS_GRADIENT[pos]} pointer-events-none`} />

      {/* Текст-контейнер в нужной 9-зонной позиции */}
      <div className={`absolute inset-0 flex ${POS_CLASSES[pos]}`}>
        <div style={{ padding: f.pad, maxWidth: "82%" }}>
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
        </div>
      </div>
    </div>
  );
}
