import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'
import {
  PUBLIC_TEMPLATE,
  cleanSubject,
  isFreshSubscriber,
  isServiceRoleCaller,
  isValidEmail,
  maskEmail,
  parseEmailList,
  resolveSupportRecipient,
  sanitizeSupportEscalationData,
} from './guard.ts'

// Configuration baked in at scaffold time — do NOT change these manually.
// To update, re-run the email domain setup flow.
const SITE_NAME = "DSOM"
// SENDER_DOMAIN is the verified sender subdomain FQDN (e.g., "notify.example.com").
// It MUST match the subdomain delegated to Lovable's nameservers — never the root domain.
// The email API looks up this exact domain; a mismatch causes "No email domain record found".
const SENDER_DOMAIN = "notify.dsom.ru"
// FROM_DOMAIN is the domain shown in the From: header (e.g., "example.com").
// When display_from_root is enabled, this can be the root domain for cleaner branding,
// even though actual sending uses the subdomain above.
const FROM_DOMAIN = "dsom.ru"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// Generate a cryptographically random 32-byte hex token
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Auth (SEC-2, аудит 28.09.2026): на self-hosted шлюз JWT не проверяет, а anon-ключ
// публичный, поэтому доступ проверяется здесь.
//  - С серверным ключом (service_role в Authorization/apikey) — любой шаблон.
//  - Без него — ТОЛЬКО 'newsletter-confirmation' и ТОЛЬКО на адрес, который есть
//    в newsletter_subscribers и добавлен туда за последние PUBLIC_WINDOW_MINUTES минут;
//    одно письмо на адрес (повтор не ставится в очередь).
//  - support-escalation: получатель только из SUPPORT_ESCALATION_TO или support_channels.email.
// В логах email маскируется, клиенту не отдаются внутренние подробности (SEC-10).

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const isService = isServiceRoleCaller(
    req.headers.get('authorization'),
    req.headers.get('apikey'),
    supabaseServiceKey,
  )

  // Parse request body
  let templateName: string
  let recipientEmail: string
  let idempotencyKey: string
  let messageId: string
  let templateData: Record<string, any> = {}
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    messageId = crypto.randomUUID()
    idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  if (!templateName || typeof templateName !== 'string') {
    return json({ error: 'templateName is required' }, 400)
  }

  // 1. Look up template from registry (early — needed to resolve recipient).
  // Список шаблонов клиенту не отдаём (SEC-10).
  const template = Object.prototype.hasOwnProperty.call(TEMPLATES, templateName)
    ? TEMPLATES[templateName]
    : undefined

  if (!template) {
    console.warn('Template not found in registry', { templateName: String(templateName).slice(0, 64) })
    return json({ error: 'Template not found' }, 404)
  }

  // Без серверного ключа — только публичный шаблон.
  if (!isService && templateName !== PUBLIC_TEMPLATE) {
    console.warn('Rejected non-service call', { templateName })
    return json({ error: 'Unauthorized' }, 401)
  }

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Resolve effective recipient: template-level `to` takes precedence over
  // the caller-provided recipientEmail.
  let effectiveRecipient: string = template.to || recipientEmail
  // Публичный путь «забрал» право на письмо (confirmation_sent_at) — при сбое постановки в очередь вернуть.
  let claimedPattern = ''

  if (!isService) {
    // Публичный путь: письмо-подтверждение подписки из NewsletterForm.
    const email = typeof recipientEmail === 'string' ? recipientEmail.trim().toLowerCase() : ''
    if (!isValidEmail(email)) {
      return json({ error: 'recipientEmail is required' }, 400)
    }

    // ilike без подстановочных символов: % _ \ экранируются, сравнение без учёта регистра
    const emailPattern = email.replace(/[\\%_]/g, (c) => '\\' + c)
    const { data: sub, error: subError } = await supabase
      .from('newsletter_subscribers')
      .select('created_at, is_active, unsubscribed_at')
      .ilike('email', emailPattern)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError) {
      console.error('Subscriber lookup failed', { code: subError.code })
      return json({ error: 'Failed to prepare email' }, 500)
    }
    if (
      !sub ||
      !sub.is_active ||
      sub.unsubscribed_at ||
      !isFreshSubscriber(sub.created_at, new Date())
    ) {
      console.warn('Public confirmation rejected: no fresh subscriber', {
        recipient: maskEmail(email),
      })
      // Ответ не раскрывает, есть ли адрес в базе.
      return json({ error: 'Unauthorized' }, 401)
    }

    // Одно подтверждение на адрес — атомарно. UPDATE … WHERE confirmation_sent_at IS NULL идёт
    // под блокировкой строки: из N параллельных запросов строку «забирает» только первый,
    // остальные получают 0 строк и выходят. Одной проверки по email_send_log (ниже) мало:
    // строка pending пишется только после рендера письма, и все запросы в этом окне проходили.
    const { data: claimed, error: claimError } = await supabase
      .from('newsletter_subscribers')
      .update({ confirmation_sent_at: new Date().toISOString() })
      .ilike('email', emailPattern)
      .is('confirmation_sent_at', null)
      .select('id')

    if (claimError) {
      // Колонки ещё нет (sec.sql не применён): работаем по старой проверке ниже, но пишем в лог.
      if (claimError.code === '42703' || claimError.code === 'PGRST204') {
        console.warn('confirmation_sent_at missing: apply sec.sql; falling back to send-log check')
      } else {
        console.error('Confirmation claim failed', { code: claimError.code })
        return json({ error: 'Failed to prepare email' }, 500)
      }
    } else if (!claimed || claimed.length === 0) {
      return json({ success: true, queued: true })
    } else {
      claimedPattern = emailPattern
    }

    // Одно подтверждение на адрес: если уже ставили в очередь/отправили — не повторяем.
    const { data: already, error: alreadyError } = await supabase
      .from('email_send_log')
      .select('id')
      .eq('template_name', PUBLIC_TEMPLATE)
      .eq('recipient_email', email)
      .in('status', ['pending', 'sent'])
      .limit(1)
      .maybeSingle()

    if (alreadyError) {
      console.error('Send-log lookup failed', { code: alreadyError.code })
      return json({ error: 'Failed to prepare email' }, 500)
    }
    if (already) {
      return json({ success: true, queued: true })
    }

    effectiveRecipient = email
    // Данные шаблона и ключ идемпотентности задаёт сервер, а не клиент.
    templateData = { recipient: email }
    idempotencyKey = `newsletter-confirm-${email}`
  } else if (templateName === 'support-escalation') {
    // Получатель эскалации — только из SUPPORT_ESCALATION_TO или адресов каналов поддержки.
    const envList = parseEmailList(Deno.env.get('SUPPORT_ESCALATION_TO'))
    const { data: channels, error: chError } = await supabase
      .from('support_channels')
      .select('email')
    if (chError) {
      console.warn('support_channels lookup failed', { code: chError.code })
    }
    const channelEmails = (channels || [])
      .map((c: { email?: string | null }) => (c.email || '').trim().toLowerCase())
      .filter((e: string) => isValidEmail(e))
    const resolved = resolveSupportRecipient(recipientEmail, envList, channelEmails)
    if (!resolved) {
      console.error('support-escalation: recipient not allowed and SUPPORT_ESCALATION_TO is empty', {
        requested: maskEmail(recipientEmail),
      })
      return json({ error: 'Recipient not allowed' }, 400)
    }
    effectiveRecipient = resolved
    templateData = sanitizeSupportEscalationData(templateData)
  }

  if (!effectiveRecipient || !isValidEmail(effectiveRecipient)) {
    return json({ error: 'recipientEmail is required' }, 400)
  }

  // 2. Check suppression list (fail-closed: if we can't verify, don't send)
  const { data: suppressed, error: suppressionError } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', effectiveRecipient.toLowerCase())
    .maybeSingle()

  if (suppressionError) {
    console.error('Suppression check failed — refusing to send', {
      error: suppressionError,
      recipient: maskEmail(effectiveRecipient),
    })
    return new Response(
      JSON.stringify({ error: 'Failed to verify suppression status' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (suppressed) {
    // Log the suppressed attempt
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
    })

    console.log('Email suppressed', { recipient: maskEmail(effectiveRecipient), templateName })
    // Публичному вызову не раскрываем, что адрес в списке подавления (SEC-10): ответ как у обычной постановки.
    if (!isService) return json({ success: true, queued: true })
    return new Response(
      JSON.stringify({ success: false, reason: 'email_suppressed' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // 3. Get or create unsubscribe token (one token per email address)
  const normalizedEmail = effectiveRecipient.toLowerCase()
  let unsubscribeToken: string

  // Check for existing token for this email
  const { data: existingToken, error: tokenLookupError } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (tokenLookupError) {
    console.error('Token lookup failed', {
      error: tokenLookupError,
      recipient: maskEmail(normalizedEmail),
    })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: 'Failed to look up unsubscribe token',
    })
    return new Response(
      JSON.stringify({ error: 'Failed to prepare email' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (existingToken && !existingToken.used_at) {
    // Reuse existing unused token
    unsubscribeToken = existingToken.token
  } else if (!existingToken) {
    // Create new token — upsert handles concurrent inserts gracefully
    unsubscribeToken = generateToken()
    const { error: tokenError } = await supabase
      .from('email_unsubscribe_tokens')
      .upsert(
        { token: unsubscribeToken, email: normalizedEmail },
        { onConflict: 'email', ignoreDuplicates: true }
      )

    if (tokenError) {
      console.error('Failed to create unsubscribe token', {
        error: tokenError,
      })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'failed',
        error_message: 'Failed to create unsubscribe token',
      })
      return new Response(
        JSON.stringify({ error: 'Failed to prepare email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If another request raced us, our upsert was silently ignored.
    // Re-read to get the actual stored token.
    const { data: storedToken, error: reReadError } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (reReadError || !storedToken) {
      console.error('Failed to read back unsubscribe token after upsert', {
        error: reReadError,
        recipient: maskEmail(normalizedEmail),
      })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'failed',
        error_message: 'Failed to confirm unsubscribe token storage',
      })
      return new Response(
        JSON.stringify({ error: 'Failed to prepare email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    unsubscribeToken = storedToken.token
  } else {
    // Token exists but is already used — email should have been caught by suppression check above.
    // This is a safety fallback; log and skip sending.
    console.warn('Unsubscribe token already used but email not suppressed', {
      recipient: maskEmail(normalizedEmail),
    })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
      error_message:
        'Unsubscribe token used but email missing from suppressed list',
    })
    if (!isService) return json({ success: true, queued: true })
    return new Response(
      JSON.stringify({ success: false, reason: 'email_suppressed' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // 4. Render React Email template to HTML and plain text
  const html = await renderAsync(
    React.createElement(template.component, templateData)
  )
  const plainText = await renderAsync(
    React.createElement(template.component, templateData),
    { plainText: true }
  )

  // Resolve subject — supports static string or dynamic function
  const resolvedSubject = cleanSubject(
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject
  )

  // 5. Enqueue the pre-rendered email for async processing by the dispatcher.
  // The dispatcher (process-email-queue) handles sending, retries, and rate-limit backoff.

  // Log pending BEFORE enqueue so we have a record even if enqueue crashes
  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: 'pending',
  })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: resolvedSubject,
      html,
      text: plainText,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    console.error('Failed to enqueue email', {
      error: enqueueError,
      templateName,
      recipient: maskEmail(effectiveRecipient),
    })

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: 'Failed to enqueue email',
    })

    if (claimedPattern) {
      // Письмо не ушло в очередь — снимаем захват, чтобы повторная попытка подписчика сработала.
      await supabase
        .from('newsletter_subscribers')
        .update({ confirmation_sent_at: null })
        .ilike('email', claimedPattern)
    }

    return new Response(JSON.stringify({ error: 'Failed to enqueue email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log('Transactional email enqueued', { templateName, recipient: maskEmail(effectiveRecipient) })

  return new Response(
    JSON.stringify({ success: true, queued: true }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
})
