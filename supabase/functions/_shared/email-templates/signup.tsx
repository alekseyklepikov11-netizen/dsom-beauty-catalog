/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Добро пожаловать в DSOM — подтвердите email</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Brand mark */}
        <Section style={brand}>
          <Text style={brandMark}>— DSOM</Text>
        </Section>

        {/* Hero */}
        <Heading style={h1}>Добро пожаловать.</Heading>
        <Text style={leadText}>
          Мы рады, что вы с нами. DSOM — это уход за кожей с характером:
          концентрированные формулы, бережный ритуал, видимый результат.
        </Text>

        {/* Confirmation block */}
        <Section style={confirmBlock}>
          <Text style={confirmLabel}>— Подтверждение email</Text>
          <Text style={confirmText}>
            Чтобы активировать аккаунт и защитить его от ботов,
            подтвердите адрес{' '}
            <span style={emailHighlight}>{recipient}</span>.
          </Text>
          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>
              Подтвердить email
            </Button>
          </Section>
          <Text style={smallText}>
            Кнопка не работает? Скопируйте ссылку:
            <br />
            <Link href={confirmationUrl} style={link}>
              {confirmationUrl}
            </Link>
          </Text>
        </Section>

        <Hr style={hr} />

        {/* Brand story */}
        <Text style={sectionLabel}>— Философия DSOM</Text>
        <Heading as="h2" style={h2}>
          Кожа знает,<br />что ей нужно.
        </Heading>
        <Text style={text}>
          Мы создаём средства на основе чистых активов и натуральных
          экстрактов. Без избыточной отдушки, без лишнего — только то,
          что действительно работает.
        </Text>

        {/* Three pillars */}
        <Section style={pillars}>
          <Row>
            <Column style={pillarCol}>
              <Text style={pillarNumber}>01</Text>
              <Text style={pillarTitle}>Формула</Text>
              <Text style={pillarText}>
                Концентрации активов, проверенные исследованиями.
                Никаких компромиссов.
              </Text>
            </Column>
          </Row>
          <Row>
            <Column style={pillarCol}>
              <Text style={pillarNumber}>02</Text>
              <Text style={pillarTitle}>Ритуал</Text>
              <Text style={pillarText}>
                Простые шаги для ежедневного ухода. Время для себя
                каждое утро и вечер.
              </Text>
            </Column>
          </Row>
          <Row>
            <Column style={pillarCol}>
              <Text style={pillarNumber}>03</Text>
              <Text style={pillarTitle}>Результат</Text>
              <Text style={pillarText}>
                Здоровое сияние, ровный тон, ощущение комфорта.
                Видимо уже через 2 недели.
              </Text>
            </Column>
          </Row>
        </Section>

        {/* CTA secondary */}
        <Section style={ctaSecondary}>
          <Text style={text}>
            После подтверждения email вас ждут персональные
            рекомендации, ранний доступ к новинкам и закрытые
            коллекции для зарегистрированных клиентов.
          </Text>
          <Link href={siteUrl} style={textLink}>
            Изучить каталог →
          </Link>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Если вы не создавали аккаунт в DSOM, просто проигнорируйте
          это письмо — ничего не произойдёт.
        </Text>
        <Text style={footerBrand}>
          <Link href={siteUrl} style={footerLink}>
            {siteName}
          </Link>
          {' · '}Уход за кожей с характером
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', Arial, sans-serif",
  margin: 0,
  padding: 0,
}
const container = {
  maxWidth: '580px',
  margin: '0 auto',
  padding: '48px 36px',
  backgroundColor: 'hsl(36, 33%, 96%)',
}
const brand = { marginBottom: '40px' }
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
  fontSize: '44px',
  fontWeight: 400 as const,
  color: 'hsl(30, 12%, 14%)',
  margin: '0 0 20px',
  lineHeight: 1.05,
  letterSpacing: '-0.015em',
}
const h2 = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: '32px',
  fontWeight: 400 as const,
  color: 'hsl(30, 12%, 14%)',
  margin: '0 0 16px',
  lineHeight: 1.1,
  letterSpacing: '-0.01em',
}
const leadText = {
  fontSize: '16px',
  color: 'hsl(30, 12%, 14%)',
  lineHeight: 1.6,
  margin: '0 0 36px',
  fontWeight: 300 as const,
}
const text = {
  fontSize: '14px',
  color: 'hsl(30, 12%, 14%)',
  lineHeight: 1.7,
  margin: '0 0 16px',
  fontWeight: 300 as const,
}
const sectionLabel = {
  fontSize: '10px',
  letterSpacing: '0.25em',
  textTransform: 'uppercase' as const,
  color: 'hsl(18, 38%, 52%)',
  margin: '0 0 12px',
  fontWeight: 500 as const,
}
const confirmBlock = {
  backgroundColor: '#ffffff',
  padding: '32px 28px',
  borderRadius: '4px',
  margin: '0 0 32px',
  border: '1px solid hsl(32, 14%, 84%)',
}
const confirmLabel = {
  fontSize: '10px',
  letterSpacing: '0.25em',
  textTransform: 'uppercase' as const,
  color: 'hsl(18, 38%, 52%)',
  margin: '0 0 12px',
  fontWeight: 500 as const,
}
const confirmText = {
  fontSize: '14px',
  color: 'hsl(30, 12%, 14%)',
  lineHeight: 1.6,
  margin: '0 0 24px',
  fontWeight: 300 as const,
}
const emailHighlight = {
  color: 'hsl(30, 12%, 14%)',
  fontWeight: 500 as const,
  borderBottom: '1px solid hsl(18, 38%, 52%)',
  paddingBottom: '1px',
}
const buttonWrap = { margin: '0 0 20px' }
const button = {
  backgroundColor: 'hsl(30, 12%, 14%)',
  color: 'hsl(36, 33%, 96%)',
  fontSize: '11px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  borderRadius: '999px',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: 500 as const,
}
const link = {
  color: 'hsl(18, 38%, 52%)',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
}
const textLink = {
  color: 'hsl(30, 12%, 14%)',
  textDecoration: 'none',
  borderBottom: '1px solid hsl(30, 12%, 14%)',
  paddingBottom: '2px',
  fontSize: '12px',
  letterSpacing: '0.05em',
  fontWeight: 500 as const,
  display: 'inline-block',
  marginTop: '8px',
}
const smallText = {
  fontSize: '11px',
  color: 'hsl(30, 8%, 40%)',
  lineHeight: 1.6,
  margin: 0,
  wordBreak: 'break-all' as const,
}
const pillars = { margin: '24px 0 36px' }
const pillarCol = {
  padding: '20px 0',
  borderBottom: '1px solid hsl(32, 14%, 84%)',
}
const pillarNumber = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: '14px',
  color: 'hsl(18, 38%, 52%)',
  margin: '0 0 4px',
  fontStyle: 'italic' as const,
}
const pillarTitle = {
  fontSize: '11px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: 'hsl(30, 12%, 14%)',
  margin: '0 0 8px',
  fontWeight: 500 as const,
}
const pillarText = {
  fontSize: '13px',
  color: 'hsl(30, 8%, 40%)',
  lineHeight: 1.6,
  margin: 0,
  fontWeight: 300 as const,
}
const ctaSecondary = { margin: '32px 0' }
const hr = {
  border: 'none',
  borderTop: '1px solid hsl(32, 14%, 84%)',
  margin: '36px 0 24px',
}
const footer = {
  fontSize: '12px',
  color: 'hsl(30, 8%, 40%)',
  lineHeight: 1.6,
  margin: '0 0 12px',
}
const footerBrand = {
  fontSize: '10px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  color: 'hsl(30, 8%, 40%)',
  margin: 0,
}
const footerLink = {
  color: 'hsl(30, 12%, 14%)',
  textDecoration: 'none',
}
