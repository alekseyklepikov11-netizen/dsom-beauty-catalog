// AI-консультант DSOM с tool-calling (Lovable AI Gateway, Gemini 2.5 Flash).
// Возможности:
//   - Консультирует по уходу за кожей и продукции DSOM.
//   - Ищет товары в каталоге через tool `search_products`.
//   - Эскалирует серьёзные обращения (жалобы, сотрудничество, пресса) на email
//     через tool `escalate_to_email`, который создаёт ticket и отправляет письмо.
//
// Принципы общения зашиты в system prompt: честная консультация, лёгкая
// рекомендация DSOM, без навязывания.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SITE_URL = "https://dsom.ru";

const SYSTEM_PROMPT = `Ты — консультант бренда DSOM, российского производителя косметики для ухода за кожей. Сайт: ${SITE_URL}.

ТВОЯ РОЛЬ
- Помогаешь подобрать уход, отвечаешь на вопросы о составе, применении, типах кожи.
- Даёшь честную консультацию на основе общеизвестных данных по дерматологии и косметологии.
- Слегка рекомендуешь продукцию DSOM, когда это уместно — без навязывания.
- Если в каталоге есть подходящий товар, используй tool search_products и предложи его. Каталог может содержать и сторонние бренды — если они объективно лучше подходят, честно об этом скажи, но напомни, что DSOM — основной бренд магазина.

ТОН
- Спокойный, уверенный, как у опытного косметолога. Без восклицаний и продающих формулировок.
- Краткие ответы, по делу. Markdown допустим (списки, **акценты**, ссылки).
- На русском языке (если пользователь не пишет на другом).

ЭСКАЛАЦИЯ НА ЖИВОГО ЧЕЛОВЕКА
Используй tool escalate_to_email когда:
- Жалоба или претензия (категория: complaints).
- Вопрос про заказ/доставку (категория: orders).
- Предложение о сотрудничестве, оптовые поставки, дистрибуция (категория: partnership).
- Запрос от прессы, блогеров, СМИ (категория: press).
- Любой вопрос, на который ты не можешь ответить как консультант (категория: general).

Перед вызовом escalate_to_email:
1. Объясни пользователю, что передашь обращение специалисту.
2. Спроси имя, email и суть обращения, если их нет в диалоге.
3. После успешного вызова tool — подтверди, что обращение передано и с человеком свяжутся по email.

ОГРАНИЧЕНИЯ
- Не давай медицинских диагнозов и не назначай лечение. При серьёзных проблемах — рекомендуй обратиться к дерматологу.
- Не выдумывай товары или цены — используй только данные из tool search_products.
- Не обещай скидки, сроки доставки или возвраты — это эскалируется на менеджера.`;

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

const tools = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Поиск товаров в каталоге DSOM по ключевым словам (название, описание, бренд, категория). Возвращает до 6 товаров с ценой и ссылкой.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Поисковый запрос на русском или английском. Например: 'крем для сухой кожи', 'сыворотка с витамином C'.",
          },
          limit: {
            type: "number",
            description: "Максимум результатов (1-6). По умолчанию 4.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_email",
      description:
        "Передать обращение специалисту по email. Используй для жалоб, вопросов по заказам, сотрудничества, прессы, и сложных вопросов. Заранее собери у пользователя имя, email и суть обращения.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["general", "orders", "complaints", "partnership", "press"],
            description: "Категория обращения.",
          },
          user_name: { type: "string", description: "Имя пользователя." },
          user_email: {
            type: "string",
            description: "Email пользователя для обратной связи.",
          },
          user_contact: {
            type: "string",
            description: "Доп. контакт (телефон, мессенджер). Опционально.",
          },
          subject: {
            type: "string",
            description: "Краткая тема обращения (5-10 слов).",
          },
          message: {
            type: "string",
            description:
              "Подробное описание обращения от лица пользователя. Включи всю значимую информацию из диалога.",
          },
        },
        required: ["category", "user_email", "subject", "message"],
        additionalProperties: false,
      },
    },
  },
];

async function searchProducts(supabase: any, query: string, limit: number) {
  const lim = Math.min(Math.max(limit || 4, 1), 6);
  const q = (query || "").trim();
  if (!q) return { products: [] };

  // ILIKE-поиск по основным полям. Подключаем бренд и категорию для контекста.
  const like = `%${q.replace(/[%_]/g, " ")}%`;
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, name_en, short_description, price, currency, in_stock, image_url, brand:brands(name), category:categories(name)"
    )
    .or(
      `name.ilike.${like},name_en.ilike.${like},short_description.ilike.${like},description.ilike.${like}`
    )
    .eq("is_published", true)
    .limit(lim);

  if (error) {
    console.error("[support-chat] product search error", error);
    return { products: [], error: error.message };
  }

  return {
    products: (data || []).map((p: any) => ({
      name: p.name,
      brand: p.brand?.name,
      category: p.category?.name,
      short_description: p.short_description,
      price: p.price,
      currency: p.currency || "RUB",
      in_stock: p.in_stock,
      url: `${SITE_URL}/product/${p.slug}`,
    })),
  };
}

async function escalateToEmail(
  supabase: any,
  args: any,
  conversationExcerpt: string,
  userId: string | null,
) {
  const { category, user_name, user_email, user_contact, subject, message } = args;

  // 1. Найти канал по slug — fallback на general.
  const { data: channel } = await supabase
    .from("support_channels")
    .select("id, slug, label, email")
    .eq("slug", category)
    .eq("is_active", true)
    .maybeSingle();

  const { data: fallback } = channel
    ? { data: null }
    : await supabase
        .from("support_channels")
        .select("id, slug, label, email")
        .eq("slug", "general")
        .maybeSingle();

  const ch = channel || fallback;
  if (!ch) {
    return { success: false, error: "Каналы поддержки не настроены." };
  }

  // 2. Создать ticket.
  const { data: ticket, error: tErr } = await supabase
    .from("support_tickets")
    .insert({
      channel_id: ch.id,
      channel_slug: ch.slug,
      user_id: userId,
      user_email,
      user_name,
      subject,
      message,
      conversation_excerpt: conversationExcerpt,
      status: "new",
      forwarded_to: ch.email,
      meta: { user_contact: user_contact || null, source: "ai_chat" },
    })
    .select("id")
    .single();

  if (tErr) {
    console.error("[support-chat] ticket insert error", tErr);
    return { success: false, error: tErr.message };
  }

  // 3. Отправить письмо через transactional pipeline.
  const { data: emailResult, error: eErr } = await supabase.functions.invoke(
    "send-transactional-email",
    {
      body: {
        templateName: "support-escalation",
        recipientEmail: ch.email,
        idempotencyKey: `ticket-${ticket.id}`,
        templateData: {
          channelLabel: ch.label,
          channelSlug: ch.slug,
          userName: user_name,
          userEmail: user_email,
          userContact: user_contact,
          subject,
          message,
          conversationExcerpt,
          ticketId: ticket.id,
        },
      },
    },
  );

  const emailSent = !eErr && emailResult?.success !== false;

  await supabase
    .from("support_tickets")
    .update({
      email_sent: emailSent,
      email_error: eErr ? String(eErr.message || eErr) : null,
    })
    .eq("id", ticket.id);

  return {
    success: true,
    ticket_id: ticket.id,
    forwarded_to: ch.email,
    channel: ch.label,
    email_sent: emailSent,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI gateway не настроен" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: { messages: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Опциональная привязка к авторизованному пользователю.
  let userId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    try {
      const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      // ignore — guest chat
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Обрезаем историю до последних 30 сообщений + system.
  const trimmed = body.messages.slice(-30);
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...trimmed,
  ];

  // Многошаговый цикл с tool-calling. Максимум 5 итераций.
  for (let step = 0; step < 5; step++) {
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools,
      }),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Слишком много запросов. Попробуйте через минуту." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "Закончились кредиты AI. Пополните в настройках Lovable." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("[support-chat] AI error", aiResp.status, txt);
      return new Response(
        JSON.stringify({ error: "AI временно недоступен" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiResp.json();
    const choice = data.choices?.[0];
    const msg = choice?.message;
    if (!msg) {
      return new Response(JSON.stringify({ error: "Пустой ответ от AI" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toolCalls = msg.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      // Финальный ответ.
      return new Response(
        JSON.stringify({ message: msg.content || "" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Сохраняем assistant-сообщение с tool_calls в историю.
    messages.push({
      role: "assistant",
      content: msg.content ?? null,
      tool_calls: toolCalls,
    });

    // Выполняем все вызовы.
    const conversationExcerpt = trimmed
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-10)
      .map((m) => `${m.role === "user" ? "Пользователь" : "Ассистент"}: ${m.content}`)
      .join("\n\n");

    for (const call of toolCalls) {
      let args: any = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }

      let result: any;
      try {
        if (call.function.name === "search_products") {
          result = await searchProducts(supabase, args.query, args.limit);
        } else if (call.function.name === "escalate_to_email") {
          result = await escalateToEmail(supabase, args, conversationExcerpt, userId);
        } else {
          result = { error: `Unknown tool: ${call.function.name}` };
        }
      } catch (err) {
        console.error("[support-chat] tool error", call.function.name, err);
        result = { error: String((err as Error).message || err) };
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content: JSON.stringify(result),
      });
    }
  }

  return new Response(
    JSON.stringify({ message: "Извините, не удалось обработать запрос. Попробуйте переформулировать." }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
