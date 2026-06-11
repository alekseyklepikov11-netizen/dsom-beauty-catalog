// Edge Function: claim-promo-code
// Вызывается фронтом после подтверждения email через voronку регистрации.
// Идемпотентна: возвращает существующий код, если уже выдан.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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
  launch_date: "2026-07-01",
  phase1_end: "2026-07-31",
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
    console.log("[claim-promo] auth header present:", !!authHeader);
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "no auth" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    console.log("[claim-promo] env:", { hasUrl: !!supabaseUrl, hasAnon: !!anon, hasService: !!serviceKey });

    // 1. Валидируем пользователя через JWT
    // getUser() без аргумента читает локальную сессию (которой нет в edge-fn),
    // поэтому достаём токен из Authorization header и передаём явно.
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    const userClient = createClient(supabaseUrl, anon);
    const { data: { user }, error: userErr } = await userClient.auth.getUser(jwt);
    if (userErr || !user) {
      console.error("[claim-promo] getUser failed:", userErr);
      return new Response(JSON.stringify({ error: "invalid session", detail: userErr?.message }), { status: 401, headers: corsHeaders });
    }
    console.log("[claim-promo] user:", { id: user.id, email: user.email, confirmed_at: user.email_confirmed_at || user.confirmed_at });
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

      // Сдвиг даты старта не должен «сжигать» ранее выданные коды:
      // если сохранённый срок launch-кода истекает раньше актуального минимума — продлеваем (extend-only).
      if (phase === "launch") {
        const minValid = validUntil("launch");
        if (validUntilDate < minValid) {
          validUntilDate = minValid;
          await admin.from("promo_leads").update({ valid_until: minValid }).ilike("email", emailLower);
          console.log("[claim-promo] extended valid_until to", minValid, "for", emailLower);
        }
      }
    } else {
      phase = currentPhase();
      code = phase === "launch" ? LAUNCH_CONFIG.launch_code : LAUNCH_CONFIG.welcome_code;
      discount = phase === "launch" ? LAUNCH_CONFIG.launch_discount : LAUNCH_CONFIG.welcome_discount;
      validUntilDate = validUntil(phase);

      console.log("[claim-promo] inserting lead:", { email: emailLower, phase, code, validUntilDate });
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
        console.error("[claim-promo] insert error:", insErr.message, insErr.details, insErr.hint);
        return new Response(JSON.stringify({ error: "save failed", detail: insErr.message }), {
          status: 500, headers: corsHeaders,
        });
      }
      console.log("[claim-promo] lead inserted OK");

      // Отправить welcome+promo письмо НАПРЯМУЮ через SMTP
      // (минимум зависимостей, надёжнее цепочки через send-transactional-email)
      try {
        const tplResp = await fetch("https://dsom.ru/email-templates/promo-welcome.html");
        let html = await tplResp.text();
        const validUntilHuman = new Date(validUntilDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
        html = html
          .replaceAll("{{CODE}}", code)
          .replaceAll("{{CODE_LOWER}}", code.toLowerCase())
          .replaceAll("{{DISCOUNT}}", String(discount))
          .replaceAll("{{VALID_UNTIL}}", validUntilHuman);

        const smtpUser = Deno.env.get("SMTP_USER") || "";
        const smtpPass = Deno.env.get("SMTP_PASS") || "";
        if (smtpUser && smtpPass) {
          const client = new SMTPClient({
            connection: {
              hostname: Deno.env.get("SMTP_HOST") || "smtp.beget.com",
              port: Number(Deno.env.get("SMTP_PORT") || 465),
              tls: true,
              auth: { username: smtpUser, password: smtpPass },
            },
          });
          await client.send({
            from: `DSOM <${smtpUser}>`,
            to: user.email,
            subject: "Ваш промокод DSOM",
            content: "Ваш промокод " + code + ". Скидка " + discount + "% на первый заказ на Ozon. Действует до " + validUntilHuman + ".",
            html,
          });
          await client.close();
          console.log("[claim-promo] email sent to", user.email);
        } else {
          console.warn("[claim-promo] SMTP_USER/PASS missing, skip email");
        }
      } catch (e) {
        console.warn("[claim-promo] email send failed:", String(e));
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
