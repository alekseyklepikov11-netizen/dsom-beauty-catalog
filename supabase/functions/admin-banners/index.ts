// ============================================================
// admin-banners — edge function для CRUD баннеров минуя RLS.
// ============================================================
// Зачем: фронтенд supabase-js может скатываться на anon при expired JWT
// и тогда RLS блокирует UPDATE/DELETE с silent fail (PostgREST возвращает
// 200 с пустым массивом). Эта функция:
//   1. Принимает JWT юзера в Authorization header
//   2. Проверяет что юзер существует И имеет admin role
//   3. Если да — выполняет операцию через service_role (RLS bypassed)
//   4. Возвращает результат
// ============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action = "insert" | "update" | "delete";

interface RequestBody {
  action: Action;
  id?: string;       // для update / delete
  payload?: any;     // для insert / update
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // ============================================================
  // 1. Получаем env vars
  // ============================================================
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
    return json({ ok: false, error: "Edge function misconfigured: missing env" }, 500);
  }

  // ============================================================
  // 2. Достаём JWT юзера из Authorization header
  // ============================================================
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ ok: false, error: "Missing Authorization Bearer header" }, 401);
  }
  const userJwt = authHeader.slice(7);

  // ============================================================
  // 3. Верифицируем JWT и достаём user_id.
  //    auth.getUser(jwt) — explicit JWT validation без зависимости от
  //    session record (в edge runtime нет localStorage/cookies).
  // ============================================================
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(userJwt);
  if (userError || !userData.user) {
    return json({
      ok: false,
      error: "Invalid or expired session",
      hint: "Re-login at /admin/login",
      debug: userError?.message,
    }, 401);
  }

  const user = userData.user;

  // ============================================================
  // 4. Проверяем admin role через service_role (всегда читает корректно)
  // ============================================================
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: roles, error: rolesError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    return json({ ok: false, error: "Failed to verify roles", debug: rolesError.message }, 500);
  }

  const roleList = (roles ?? []).map((r: any) => r.role);
  const isAdmin = roleList.includes("admin") || roleList.includes("editor");

  if (!isAdmin) {
    return json({
      ok: false,
      error: "Forbidden: user has no admin/editor role",
      user: user.email,
      roles: roleList,
    }, 403);
  }

  // ============================================================
  // 5. Парсим тело запроса и выполняем операцию через service_role
  // ============================================================
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  if (!body.action || !["insert", "update", "delete"].includes(body.action)) {
    return json({ ok: false, error: "action must be insert | update | delete" }, 400);
  }

  try {
    if (body.action === "insert") {
      if (!body.payload) return json({ ok: false, error: "payload required for insert" }, 400);
      const cleanPayload = { ...body.payload };
      delete cleanPayload.id;
      const { data, error } = await adminClient.from("banners").insert(cleanPayload).select();
      if (error) throw error;
      return json({ ok: true, action: "insert", data, rowsAffected: data?.length ?? 0 });
    }

    if (body.action === "update") {
      if (!body.id || !body.payload) return json({ ok: false, error: "id and payload required for update" }, 400);
      const cleanPayload = { ...body.payload };
      delete cleanPayload.id;
      const { data, error } = await adminClient
        .from("banners")
        .update(cleanPayload)
        .eq("id", body.id)
        .select();
      if (error) throw error;
      return json({ ok: true, action: "update", data, rowsAffected: data?.length ?? 0 });
    }

    if (body.action === "delete") {
      if (!body.id) return json({ ok: false, error: "id required for delete" }, 400);
      const { data, error } = await adminClient
        .from("banners")
        .delete()
        .eq("id", body.id)
        .select();
      if (error) throw error;
      return json({ ok: true, action: "delete", data, rowsAffected: data?.length ?? 0 });
    }

    return json({ ok: false, error: "Unreachable" }, 500);
  } catch (e: any) {
    return json({
      ok: false,
      error: `DB operation failed: ${e?.message || e}`,
      action: body.action,
    }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
