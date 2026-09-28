// Чистые функции проверки доступа и очистки данных для send-transactional-email.
// Без внешних импортов — чтобы их можно было прогнать тестом вне Deno.
// SEC-2 / SEC-10 (аудит 28.09.2026).

/** Шаблон, который разрешено вызывать без серверного ключа (из браузера, NewsletterForm). */
export const PUBLIC_TEMPLATE = 'newsletter-confirmation'

/** Сколько минут после вставки в newsletter_subscribers разрешено публичное письмо-подтверждение. */
export const PUBLIC_WINDOW_MINUTES = 10

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

export function isValidEmail(v: unknown): v is string {
  return typeof v === 'string' && v.length >= 5 && v.length <= 255 && EMAIL_RE.test(v)
}

/** Сравнение строк за постоянное время (не выдаёт длину совпавшего префикса). */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const x = enc.encode(a)
  const y = enc.encode(b)
  let diff = x.length ^ y.length
  const n = Math.max(x.length, y.length)
  for (let i = 0; i < n; i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  }
  return diff === 0
}

/**
 * true, если вызывающий предъявил именно серверный ключ (service_role):
 * `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` или `apikey: <...>`.
 * Подпись JWT не разбираем: на self-hosted шлюз JWT не проверяет,
 * поэтому доверяем только точному совпадению с секретом из окружения.
 */
export function isServiceRoleCaller(
  authorization: string | null,
  apikey: string | null,
  serviceKey: string,
): boolean {
  if (!serviceKey) return false
  const bearer = (authorization || '').replace(/^Bearer\s+/i, '').trim()
  if (bearer && timingSafeEqual(bearer, serviceKey)) return true
  const key = (apikey || '').trim()
  if (key && timingSafeEqual(key, serviceKey)) return true
  return false
}

/** Маскирует email для логов: an***@ex***.ru */
export function maskEmail(v: unknown): string {
  if (typeof v !== 'string' || !v.includes('@')) return '***'
  const [local, domain] = v.split('@')
  const dot = domain.lastIndexOf('.')
  const host = dot > 0 ? domain.slice(0, dot) : domain
  const tld = dot > 0 ? domain.slice(dot) : ''
  return `${local.slice(0, 2)}***@${host.slice(0, 2)}***${tld}`
}

/** Убирает управляющие символы (в т.ч. CR/LF — защита от подмены заголовков письма) и режет длину. */
export function cleanText(v: unknown, max: number, singleLine = false): string | undefined {
  if (v === null || v === undefined) return undefined
  let s = String(v)
  s = singleLine
    ? s.replace(/[\u0000-\u001F\u007F]+/g, ' ')
    : s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, '')
  s = s.trim()
  if (s.length > max) s = s.slice(0, max) + '…'
  return s.length ? s : undefined
}

/** Тема письма: одна строка, без управляющих символов, не длиннее 200 знаков. */
export function cleanSubject(v: unknown): string {
  return cleanText(v, 200, true) || 'DSOM'
}

/**
 * Нормализует templateData для support-escalation: только известные поля,
 * строки без управляющих символов, с ограничением длины, userEmail — только валидный адрес
 * (он попадает в href="mailto:…"). HTML экранирует React при рендере.
 */
export function sanitizeSupportEscalationData(d: Record<string, unknown>): Record<string, string | undefined> {
  const userEmail = isValidEmail(d.userEmail) ? String(d.userEmail) : undefined
  return {
    channelLabel: cleanText(d.channelLabel, 100, true),
    channelSlug: cleanText(d.channelSlug, 60, true),
    userName: cleanText(d.userName, 120, true),
    userEmail,
    userContact: cleanText(d.userContact, 200, true),
    subject: cleanText(d.subject, 200, true),
    message: cleanText(d.message, 5000),
    conversationExcerpt: cleanText(d.conversationExcerpt, 8000),
    ticketId: cleanText(d.ticketId, 64, true),
  }
}

/** Разбирает список адресов из переменной окружения («a@x.ru, b@y.ru»). */
export function parseEmailList(v: string | undefined | null): string[] {
  return (v || '')
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => isValidEmail(s))
}

/**
 * Получатель для support-escalation. Разрешены только адреса из SUPPORT_ESCALATION_TO
 * (переменная окружения) и адреса каналов из support_channels. Любой другой адрес
 * заменяется первым адресом из SUPPORT_ESCALATION_TO; если его нет — null (отказ).
 */
export function resolveSupportRecipient(
  requested: unknown,
  envList: string[],
  channelEmails: string[],
): string | null {
  const allowed = new Set([...envList, ...channelEmails.map((e) => e.toLowerCase())])
  const req = typeof requested === 'string' ? requested.trim().toLowerCase() : ''
  if (req && allowed.has(req)) return req
  return envList[0] || null
}

/** Подписчик считается «свежим», если добавлен не раньше чем windowMinutes назад. */
export function isFreshSubscriber(createdAt: string | null | undefined, now: Date, windowMinutes = PUBLIC_WINDOW_MINUTES): boolean {
  if (!createdAt) return false
  const t = Date.parse(createdAt)
  if (Number.isNaN(t)) return false
  const age = now.getTime() - t
  return age >= -60_000 && age <= windowMinutes * 60_000
}
