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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Приглашение в DSOM</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}>
          <Text style={brandMark}>— DSOM</Text>
        </Section>
        <Heading style={h1}>Вас пригласили в DSOM</Heading>
        <Text style={text}>
          Вы получили приглашение присоединиться к{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Нажмите кнопку ниже, чтобы принять приглашение и создать аккаунт.
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>
            Принять приглашение
          </Button>
        </Section>
        <Text style={smallText}>
          Если кнопка не работает, скопируйте ссылку:
          <br />
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Если вы не ожидали этого приглашения, просто проигнорируйте письмо.
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

export default InviteEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', Arial, sans-serif",
  margin: 0,
  padding: 0,
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '40px 32px',
  backgroundColor: 'hsl(36, 33%, 96%)',
}
const brand = { marginBottom: '32px' }
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
  fontSize: '40px',
  fontWeight: 400 as const,
  color: 'hsl(30, 12%, 14%)',
  margin: '0 0 24px',
  lineHeight: 1.1,
  letterSpacing: '-0.01em',
}
const text = {
  fontSize: '15px',
  color: 'hsl(30, 12%, 14%)',
  lineHeight: 1.6,
  margin: '0 0 28px',
  fontWeight: 300 as const,
}
const buttonWrap = { margin: '0 0 32px' }
const button = {
  backgroundColor: 'hsl(30, 12%, 14%)',
  color: 'hsl(36, 33%, 96%)',
  fontSize: '11px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  borderRadius: '999px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: 500 as const,
}
const link = {
  color: 'hsl(18, 38%, 52%)',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
}
const smallText = {
  fontSize: '12px',
  color: 'hsl(30, 8%, 40%)',
  lineHeight: 1.6,
  margin: '0 0 32px',
  wordBreak: 'break-all' as const,
}
const hr = {
  border: 'none',
  borderTop: '1px solid hsl(32, 14%, 84%)',
  margin: '32px 0 24px',
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
