// Edge Function: claim-promo-code
// Вызывается фронтом после подтверждения email через voronку регистрации.
// Идемпотентна: возвращает существующий код, если уже выдан.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LaunchConfig {
  launch_date: string;
  phase1_end: string;
  launch_code: string;
  launch_discount: number;
  welcome_code: string;
  welcome_discount: number;
  ozon_seller_url: string;
}

// На VPS бот хранит конфиг в файле. Тут зеркалируем константой — нет shared-volume.
// При сдвиге даты shift-launch.py обновляет launchConfig.ts (frontend), а сюда тоже надо.
// TODO: вынести в DB-таблицу app_settings когда понадобится третья точка истины.
const LAUNCH_CONFIG: LaunchConfig = {
  launch_date: "2026-06-11",
  phase1_end: "2026-07-11",
  launch_code: "DSOM10",
  launch_discount: 10,
  welcome_code: "DSOM5",
  welcome_discount: 5,
  ozon_seller_url: "https://www.ozon.ru/seller/dsom?utm_source=email&utm_medium=promo",
};

function currentPhase(): "launch" | "welcome" {
  return new Date().toISOString().slice(0, 10) <= LAUNCH_CONFIG.phase1_end ? "launch" : "welcome";
}

function validUntil(phase: "launch" | "welcome"): string {
  const d = new Date();
  if (phase === "launch") {
    // Конец СЛЕДУЮЩЕГО месяца от сегодня
    const nextMonth = d.getMonth() === 11 ? 0 : d.getMonth() + 1;
    const year = d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear();
    const lastDay = new Date(year, nextMonth + 1, 0).getDate();
    return `${year}-${String(nextMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }
  // welcome: +1 год
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "no auth" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // 1. Валидируем пользователя через JWT
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "invalid session" }), { status: 401, headers: corsHeaders });
    }
    if (!user.email) {
      return new Response(JSON.stringify({ error: "no email" }), { status: 400, headers: corsHeaders });
    }
    if (!user.email_confirmed_at && !user.confirmed_at) {
      return new Response(JSON.stringify({ error: "email not confirmed" }), { status: 403, headers: corsHeaders });
    }

    // 2. Service-role для записи лида и поиска
    const admin = createClient(supabaseUrl, serviceKey);
    const emailLower = user.email.toLowerCase();

    // Уже выдан?
    const { data: existing } = await admin
      .from("promo_leads")
      .select("promo_code, phase, valid_until")
      .ilike("email", emailLower)
      .maybeSingle();

    let code: string, discount: number, phase: "launch" | "welcome", validUntilDate: string;

    if (existing) {
      code = existing.promo_code;
      phase = existing.phase as "launch" | "welcome";
      validUntilDate = existing.valid_until;
      discount = phase === "launch" ? LAUNCH_CONFIG.launch_discount : LAUNCH_CONFIG.welcome_discount;
    } else {
      phase = currentPhase();
      code = phase === "launch" ? LAUNCH_CONFIG.launch_code : LAUNCH_CONFIG.welcome_code;
      discount = phase === "launch" ? LAUNCH_CONFIG.launch_discount : LAUNCH_CONFIG.welcome_discount;
      validUntilDate = validUntil(phase);

      const { error: insErr } = await admin.from("promo_leads").insert({
        email: emailLower,
        user_id: user.id,
        first_name: (user.user_metadata?.full_name as string) || null,
        promo_code: code,
        phase,
        valid_until: validUntilDate,
        source: "site:registration",
      });
      if (insErr) {
        console.error("[claim-promo] insert error:", insErr);
        return new Response(JSON.stringify({ error: "save failed", detail: insErr.message }), {
          status: 500, headers: corsHeaders,
        });
      }

      // Отправить welcome+promo письмо через единый канал транзакционной почты
      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            to: user.email,
            template: "promo-welcome",
            variables: { code, ozon_url: LAUNCH_CONFIG.ozon_seller_url, discount, valid_until: validUntilDate },
          },
        });
      } catch (e) {
        console.warn("[claim-promo] email send failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        code, discount, phase,
        valid_until: validUntilDate,
        repeat: !!existing,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[claim-promo] fatal:", err);
    return new Response(JSON.stringify({ error: "internal", detail: String(err) }), {
      status: 500, headers: corsHeaders,
    });
  }
});
