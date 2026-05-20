// Edge Function: check-email
// Pre-flight check: существует ли user, подтверждён ли email.
// Используется фронтом перед signup, чтобы корректно ветвить UI.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "missing email" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Используем admin API listUsers с фильтром по email
    const emailLower = email.toLowerCase().trim();
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1, perPage: 1,
    });
    if (error) {
      console.error("[check-email] listUsers failed:", error);
      return new Response(JSON.stringify({ error: "lookup failed" }), {
        status: 500, headers: corsHeaders,
      });
    }

    // listUsers возвращает всех — фильтруем вручную
    const found = (data?.users || []).find(
      (u) => (u.email || "").toLowerCase() === emailLower
    );

    if (!found) {
      return new Response(JSON.stringify({ exists: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        exists: true,
        confirmed: !!(found.email_confirmed_at || (found as any).confirmed_at),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[check-email] error:", err);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500, headers: corsHeaders,
    });
  }
});
