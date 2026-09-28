// Edge Function: check-email
// Pre-flight перед регистрацией: существует ли пользователь и подтверждён ли email.
//
// SEC-7 (аудит 28.09.2026): замена прямого анонимного вызова RPC check_user_email из AuthPage.
// Ответ отдаётся ТОЛЬКО после серверной проверки Cloudflare Turnstile — одним вызовом
// (токен Turnstile одноразовый, поэтому этот вызов заменяет и verify-turnstile).
// Сам поиск идёт через RPC check_user_email от service_role — после переключения фронта
// у anon/authenticated право EXECUTE на неё можно отозвать (sec-phase2.sql).
//
// Запрос:  POST { email: string, token: string }
// Ответ:   200 { success: true, exists: boolean, confirmed: boolean }
//          400 { success: false, error: 'missing_email' | 'missing_token' | 'verification_failed' }
//          500 { success: false, error: 'internal_error' }
// Email в логи не пишется.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function verifyTurnstile(token: string, ip: string): Promise<boolean | null> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return null; // сервер не настроен
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = await resp.json().catch(() => ({}));
  return !!data?.success;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "method_not_allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const token = typeof body?.token === "string" ? body.token : "";

    if (!email || email.length > 255 || !EMAIL_RE.test(email)) {
      return json({ success: false, error: "missing_email" }, 400);
    }
    if (!token) {
      return json({ success: false, error: "missing_token" }, 400);
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "";

    const ok = await verifyTurnstile(token, ip);
    if (ok === null) {
      console.error("[check-email] TURNSTILE_SECRET_KEY is not set");
      return json({ success: false, error: "internal_error" }, 500);
    }
    if (!ok) {
      return json({ success: false, error: "verification_failed" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      console.error("[check-email] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
      return json({ success: false, error: "internal_error" }, 500);
    }

    // Вызов RPC через PostgREST от service_role (без supabase-js — меньше зависимостей).
    const rpc = await fetch(`${supabaseUrl}/rest/v1/rpc/check_user_email`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_email: email }),
    });
    if (!rpc.ok) {
      console.error("[check-email] rpc failed", { status: rpc.status });
      return json({ success: false, error: "internal_error" }, 500);
    }
    const rows = await rpc.json().catch(() => []);
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    return json({
      success: true,
      exists: !!row?.user_exists,
      confirmed: !!row?.is_confirmed,
    });
  } catch (err) {
    console.error("[check-email] error:", err instanceof Error ? err.name : "unknown");
    return json({ success: false, error: "internal_error" }, 500);
  }
});
