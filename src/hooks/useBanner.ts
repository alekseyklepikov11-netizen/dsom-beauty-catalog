// ============================================================
// useBanner.ts — единый hook для загрузки баннера по position.
// ============================================================
// Заменяет дублированную inline-логику из Index.tsx и Catalog.tsx.
// Возвращает discriminated union state — consumer pattern-matches.
//
// Использование:
//   const banner = useBanner("home_hero");
//   switch (banner.status) {
//     case "loading": return <Skeleton />;
//     case "ready":   return banner.banner ? <Real /> : <Fallback />;
//     case "error":   return <Fallback />;
//   }
//
// Это устраняет FOOC: consumer видит "loading" state ДО завершения fetch
// и может рендерить skeleton вместо фолбэк-текста из i18n.
// ============================================================

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import type { Pos } from "@/lib/banner-positions";

export interface BannerData {
  id: string;
  title: string;
  title_en: string | null;
  subtitle: string | null;
  subtitle_en: string | null;
  cta_label: string | null;
  cta_label_en: string | null;
  cta_url: string | null;
  image_url: string | null;
  image_srcset: Record<string, string> | null;
  image_focal_point: string | null;
  video_url: string | null;
  text_position: Pos | string | null;
  ab_group: string | null;
}

export type BannerState =
  | { status: "loading" }
  | { status: "ready"; banner: BannerData | null }
  | { status: "error"; error: string };

export type BannerPosition = "home_hero" | "catalog_top" | "about_top";

const COLS = "id,title,title_en,subtitle,subtitle_en,cta_label,cta_label_en,cta_url,image_url,video_url,ab_group,text_position,image_srcset,image_focal_point";

/**
 * Загружает активные баннеры для позиции, выбирает один случайно (для A/B),
 * фиксирует impression в analytics. Возвращает discriminated state.
 *
 * @param position — позиция баннера: home_hero | catalog_top | about_top
 */
/**
 * Возвращает true когда viewport ≤768px. Перерисовывает при resize.
 * SSR-safe: defaults к false, обновляется в useEffect.
 */
function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export function useBanner(position: BannerPosition): BannerState {
  const [state, setState] = useState<BannerState>({ status: "loading" });
  const isMobile = useIsMobileViewport();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("banners")
        .select(COLS)
        .eq("position", position)
        .eq("is_active", true)
        .order("sort_order");

      if (cancelled) return;

      if (error) {
        console.error(`useBanner(${position}) fetch error:`, error);
        setState({ status: "error", error: error.message });
        return;
      }

      const all = (data || []) as BannerData[];

      // Фильтр по _meta_variant: каждый баннер ровно ОДНОГО viewport.
      // Desktop viewport → берём только variant="desktop" (или null для backward compat).
      // Mobile viewport → берём только variant="mobile".
      const list = all.filter((b) => {
        const variant = (b.image_srcset || {})._meta_variant;
        if (isMobile) return variant === "mobile";
        return variant === "desktop" || variant == null; // null = старые баннеры до миграции
      });

      const chosen = list.length > 0
        ? list[Math.floor(Math.random() * list.length)]
        : null;

      if (chosen) {
        try {
          track("banner_view", {
            banner_id: chosen.id,
            value: chosen.ab_group || "default",
          });
        } catch {
          // analytics ошибки не должны ломать рендер
        }
      }

      setState({ status: "ready", banner: chosen });
    })();

    return () => { cancelled = true; };
  }, [position, isMobile]);

  return state;
}
