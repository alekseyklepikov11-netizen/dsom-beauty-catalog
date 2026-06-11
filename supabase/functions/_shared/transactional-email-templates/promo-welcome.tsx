/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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

interface PromoWelcomeProps {
  code?: string
  ozon_url?: string
}

const PromoWelcomeEmail = ({ code = 'DSOM5', ozon_url = 'https://www.ozon.ru/seller/dsom' }: PromoWelcomeProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Промокод {code} — 5% на старте продаж DSOM</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}>
          <Text style={brandMark}>— DSOM</Text>
        </Section>
        <Heading style={h1}>Ваш промокод</Heading>
        <Section style={codeBox}>
          <Text style={codeText}>{code}</Text>
        </Section>
        <Text style={text}>
          5% на первый заказ. Сработает на Ozon после старта продаж — в июле 2026.
          Мы напомним вам за день до запуска.
        </Text>
        <Text style={text}>
          DSOM — это сыворотки и крем с указанными концентрациями:
          Vitamin C 2000 ppm, Ретинол 0,3%, PDRN 0,1%, гиалуроновая кислота.
          Без маркетинговых уловок — все цифры на этикетке.
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={ozon_url}>
            Перейти на Ozon (после старта)
          </Button>
        </Section>
        <Text style={smallText}>
          Подписаться на Telegram-канал бренда: <Link href="https://t.me/dsom_official" style={link}>@dsom_official</Link>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Письмо отправлено на этот адрес в ответ на запрос промокода на dsom.ru.
          Чтобы отписаться от рассылок, перейдите по ссылке в любом следующем письме.
        </Text>
        <Text style={footerBrand}>
          <Link href={SITE_URL} style={footerLink}>{SITE_NAME}</Link>
          {' · '}Активная косметика с прозрачным составом
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PromoWelcomeEmail,
  subject: 'Ваш промокод DSOM5 — 5% на старте продаж',
  displayName: 'Промокод приветствия',
  previewData: { code: 'DSOM5', ozon_url: 'https://www.ozon.ru/seller/dsom' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif", margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 32px', backgroundColor: 'hsl(36, 33%, 96%)' }
const brand = { marginBottom: '32px' }
const brandMark = { fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'hsl(18, 38%, 52%)', margin: 0, fontWeight: 500 as const }
const h1 = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '40px', fontWeight: 400 as const, color: 'hsl(30, 12%, 14%)', margin: '0 0 16px', lineHeight: 1.1, letterSpacing: '-0.01em' }
const codeBox = { backgroundColor: 'hsl(30, 12%, 14%)', borderRadius: '12px', padding: '20px', textAlign: 'center' as const, margin: '0 0 28px' }
const codeText = { color: 'hsl(36, 33%, 96%)', fontSize: '32px', letterSpacing: '0.3em', fontWeight: 600 as const, margin: 0 }
const text = { fontSize: '15px', color: 'hsl(30, 12%, 14%)', lineHeight: 1.6, margin: '0 0 18px', fontWeight: 300 as const }
const buttonWrap = { margin: '20px 0 28px' }
const button = { backgroundColor: 'hsl(30, 12%, 14%)', color: 'hsl(36, 33%, 96%)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, borderRadius: '999px', padding: '14px 32px', textDecoration: 'none', display: 'inline-block', fontWeight: 500 as const }
const link = { color: 'hsl(18, 38%, 52%)', textDecoration: 'underline', textUnderlineOffset: '2px' }
const smallText = { fontSize: '13px', color: 'hsl(30, 8%, 40%)', lineHeight: 1.6, margin: '0 0 24px' }
const hr = { border: 'none', borderTop: '1px solid hsl(32, 14%, 84%)', margin: '32px 0 24px' }
const footer = { fontSize: '12px', color: 'hsl(30, 8%, 40%)', lineHeight: 1.6, margin: '0 0 12px' }
const footerBrand = { fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'hsl(30, 8%, 40%)', margin: 0 }
const footerLink = { color: 'hsl(30, 12%, 14%)', textDecoration: 'none' }
