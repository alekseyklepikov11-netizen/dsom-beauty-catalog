/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DSOM'
const SITE_URL = 'https://dsom.ru'

interface SupportEscalationProps {
  channelLabel?: string
  channelSlug?: string
  userName?: string
  userEmail?: string
  userContact?: string
  subject?: string
  message?: string
  conversationExcerpt?: string
  ticketId?: string
}

const fmt = (v?: string) => (v && v.trim().length ? v : '—')

const SupportEscalationEmail = ({
  channelLabel,
  channelSlug,
  userName,
  userEmail,
  userContact,
  subject,
  message,
  conversationExcerpt,
  ticketId,
}: SupportEscalationProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>{`Новое обращение через AI-чат DSOM${subject ? `: ${subject}` : ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}>
          <Text style={brandMark}>— DSOM · Поддержка</Text>
        </Section>

        <Heading style={h1}>Новое обращение</Heading>
        <Text style={lead}>
          Пользователь обратился через AI-чат на сайте.
          {channelLabel ? <> Категория: <strong>{channelLabel}</strong>.</> : null}
        </Text>

        <Section style={card}>
          <Text style={fieldLabel}>Имя</Text>
          <Text style={fieldValue}>{fmt(userName)}</Text>

          <Text style={fieldLabel}>Email</Text>
          <Text style={fieldValue}>
            {userEmail ? (
              <Link href={`mailto:${userEmail}`} style={link}>{userEmail}</Link>
            ) : '—'}
          </Text>

          <Text style={fieldLabel}>Доп. контакт</Text>
          <Text style={fieldValue}>{fmt(userContact)}</Text>

          <Text style={fieldLabel}>Тема</Text>
          <Text style={fieldValue}>{fmt(subject)}</Text>

          <Text style={fieldLabel}>Категория</Text>
          <Text style={fieldValue}>{fmt(channelLabel || channelSlug)}</Text>
        </Section>

        <Text style={sectionLabel}>— Сообщение</Text>
        <Section style={messageBox}>
          <Text style={messageText}>{fmt(message)}</Text>
        </Section>

        {conversationExcerpt && conversationExcerpt.trim().length ? (
          <>
            <Text style={sectionLabel}>— Контекст диалога</Text>
            <Section style={messageBox}>
              <Text style={excerptText}>{conversationExcerpt}</Text>
            </Section>
          </>
        ) : null}

        <Hr style={hr} />
        <Text style={footer}>
          {ticketId ? <>Ticket: {ticketId} · </> : null}
          <Link href={SITE_URL} style={footerLink}>{SITE_NAME}</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SupportEscalationEmail,
  subject: (data: Record<string, any>) => {
    const cat = data?.channelLabel || data?.channelSlug || 'Общее'
    const subj = data?.subject ? ` — ${data.subject}` : ''
    return `[DSOM · ${cat}] Новое обращение${subj}`
  },
  displayName: 'AI-чат: эскалация обращения',
  previewData: {
    channelLabel: 'Сотрудничество',
    channelSlug: 'partnership',
    userName: 'Анна Иванова',
    userEmail: 'anna@example.com',
    userContact: '+7 999 000-00-00',
    subject: 'Предложение о сотрудничестве',
    message: 'Здравствуйте! Хотим обсудить размещение продукции DSOM в нашей сети салонов.',
    conversationExcerpt: 'Пользователь: ...\nАссистент: ...',
    ticketId: 'preview-ticket',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', Arial, sans-serif",
  margin: 0,
  padding: 0,
}
const container = {
  maxWidth: '620px',
  margin: '0 auto',
  padding: '40px 32px',
  backgroundColor: 'hsl(36, 33%, 96%)',
}
const brand = { marginBottom: '24px' }
const brandMark = {
  fontSize: '11px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: 'hsl(18, 38%, 52%)',
  margin: 0,
  fontWeight: 500 as const,
}
const h1 = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: '34px',
  fontWeight: 400 as const,
  color: 'hsl(30, 12%, 14%)',
  margin: '0 0 16px',
  lineHeight: 1.15,
}
const lead = {
  fontSize: '14px',
  color: 'hsl(30, 12%, 14%)',
  lineHeight: 1.6,
  margin: '0 0 24px',
}
const card = {
  backgroundColor: '#ffffff',
  border: '1px solid hsl(30, 8%, 88%)',
  borderRadius: '4px',
  padding: '20px 24px',
  margin: '0 0 24px',
}
const fieldLabel = {
  fontSize: '10px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: 'hsl(30, 8%, 45%)',
  margin: '12px 0 4px',
  fontWeight: 500 as const,
}
const fieldValue = {
  fontSize: '14px',
  color: 'hsl(30, 12%, 14%)',
  margin: '0',
  lineHeight: 1.5,
}
const sectionLabel = {
  fontSize: '11px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: 'hsl(18, 38%, 52%)',
  margin: '24px 0 8px',
  fontWeight: 500 as const,
}
const messageBox = {
  backgroundColor: '#ffffff',
  border: '1px solid hsl(30, 8%, 88%)',
  borderRadius: '4px',
  padding: '18px 22px',
  margin: '0 0 16px',
}
const messageText = {
  fontSize: '14px',
  color: 'hsl(30, 12%, 14%)',
  lineHeight: 1.65,
  whiteSpace: 'pre-wrap' as const,
  margin: 0,
}
const excerptText = {
  fontSize: '13px',
  color: 'hsl(30, 8%, 35%)',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap' as const,
  margin: 0,
  fontFamily: "'JetBrains Mono', Menlo, monospace",
}
const link = {
  color: 'hsl(18, 38%, 52%)',
  textDecoration: 'none',
}
const hr = {
  borderColor: 'hsl(30, 8%, 88%)',
  margin: '32px 0 16px',
}
const footer = {
  fontSize: '11px',
  color: 'hsl(30, 8%, 45%)',
  margin: 0,
}
const footerLink = {
  color: 'hsl(30, 12%, 14%)',
  textDecoration: 'none',
  fontWeight: 500 as const,
}
