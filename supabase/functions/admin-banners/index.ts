// ============================================================
// admin-banners — edge function для CRUD баннеров минуя RLS.
// ============================================================
// Зачем: фронтенд supabase-js может скатываться на anon при expired JWT,
// и тогда RLS блокирует UPDATE/DELETE с silent fail. Эта функция:
//   1. Принимает JWT юзера в Authorization header
//   2. Верифицирует подпись JWT через JWT_SECRET (HMAC-SHA256, native crypto)
//   3. Проверяет наличие admin role в user_roles через service_role
//   4. Если ok — выполняет операцию через service_role (RLS bypassed)
//
// VERIFY_JWT=false в env edge-functions значит Kong не проверяет JWT —
// делаем сами вручную.
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
  id?: string;
  payload?: Record<string, unknown>;
}

interface JwtPayload {
  sub: string;        // user_id
  email?: string;
  exp: number;        // expiration timestamp
  iat: number;        // issued at
  aud: string;        // "authenticated"
  role?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  // ============================================================
  // 1. Env vars
  // ============================================================
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? "";

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !JWT_SECRET) {
    return json({ ok: false, error: "Edge function misconfigured: missing env" }, 500);
  }

  // ============================================================
  // 2. Extract JWT
  // ============================================================
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ ok: false, error: "Missing Authorization Bearer header" }, 401);
  }
  const userJwt = authHeader.slice(7);

  // ============================================================
  // 3. Verify JWT signature + decode payload
  // ============================================================
  let payload: JwtPayload;
  try {
    payload = await verifyJwt(userJwt, JWT_SECRET);
  } catch (e) {
    return json({
      ok: false,
      error: "Invalid or expired JWT",
      hint: "Re-login at /admin/login",
      debug: String(e),
    }, 401);
  }

  // ============================================================
  // 4. Verify admin role via service_role
  // ============================================================
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: roles, error: rolesError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", payload.sub);

  if (rolesError) {
    return json({ ok: false, error: "Failed to verify roles", debug: rolesError.message }, 500);
  }

  const roleList = (roles ?? []).map((r: { role: string }) => r.role);
  const isAdmin = roleList.includes("admin") || roleList.includes("editor");

  if (!isAdmin) {
    return json({
      ok: false,
      error: "Forbidden: user has no admin/editor role",
      user: payload.email,
      roles: roleList,
    }, 403);
  }

  // ============================================================
  // 5. Parse body and execute via service_role
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
      if (!body.id || !body.payload) return json({ ok: false, error: "id and payload required" }, 400);
      const cleanPayload = { ...body.payload };
      delete cleanPayload.id;
      const { data, error } = await adminClient.from("banners").update(cleanPayload).eq("id", body.id).select();
      if (error) throw error;
      return json({ ok: true, action: "update", data, rowsAffected: data?.length ?? 0 });
    }

    if (body.action === "delete") {
      if (!body.id) return json({ ok: false, error: "id required for delete" }, 400);
      const { data, error } = await adminClient.from("banners").delete().eq("id", body.id).select();
      if (error) throw error;
      return json({ ok: true, action: "delete", data, rowsAffected: data?.length ?? 0 });
    }

    return json({ ok: false, error: "Unreachable" }, 500);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, error: `DB operation failed: ${msg}`, action: body.action }, 500);
  }
});

// ============================================================
// JWT verification via native Web Crypto (HMAC-SHA256 = HS256)
// ============================================================

function base64UrlDecode(input: string): Uint8Array {
  // base64url → base64
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(input.length + (4 - input.length % 4) % 4, "=");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifyJwt(token: string, secret: string): Promise<JwtPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWT: expected 3 parts");
  const [headerB64, payloadB64, signatureB64] = parts;

  // Decode header to check algorithm
  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64)));
  if (header.alg !== "HS256") throw new Error(`Unsupported JWT algorithm: ${header.alg}`);

  // Verify signature
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const signature = base64UrlDecode(signatureB64);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  const valid = await crypto.subtle.verify("HMAC", key, signature, data);
  if (!valid) throw new Error("JWT signature verification failed");

  // Decode payload
  const payload: JwtPayload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error(`JWT expired at ${new Date(payload.exp * 1000).toISOString()}`);
  }

  if (!payload.sub) throw new Error("JWT missing sub claim");

  return payload;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
