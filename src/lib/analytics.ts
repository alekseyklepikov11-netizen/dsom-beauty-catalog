import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type EventType = Database["public"]["Enums"]["analytics_event_type"];

const SESSION_KEY = "dsom-session";
const COOKIE_KEY = "dsom-cookie-consent";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COOKIE_KEY) === "accepted";
}

export interface TrackOptions {
  product_id?: string | null;
  banner_id?: string | null;
  value?: string | null;
  meta?: Record<string, unknown>;
}

/**
 * Sends an analytics event. Silently skips if user hasn't accepted cookies.
 * Never throws — all failures are swallowed.
 */
export async function track(event_type: EventType, opts: TrackOptions = {}) {
  try {
    if (!hasAnalyticsConsent()) return;
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("analytics_events").insert({
      event_type,
      product_id: opts.product_id ?? null,
      banner_id: opts.banner_id ?? null,
      value: opts.value ? opts.value.slice(0, 500) : null,
      meta: (opts.meta ?? {}) as never,
      session_id: getSessionId(),
      user_id: auth.user?.id ?? null,
      path: window.location.pathname.slice(0, 500),
      referrer: document.referrer ? document.referrer.slice(0, 1000) : null,
      user_agent: navigator.userAgent.slice(0, 500),
    });
  } catch {
    // Silent fail — analytics must never break UX
  }
}
