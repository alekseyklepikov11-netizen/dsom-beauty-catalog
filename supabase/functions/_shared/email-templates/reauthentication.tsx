/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Код подтверждения — DSOM</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}>
          <Text style={brandMark}>— DSOM</Text>
        </Section>
        <Heading style={h1}>Подтверждение входа</Heading>
        <Text style={text}>
          Используйте код ниже, чтобы подтвердить вашу личность:
        </Text>
        <Section style={codeWrap}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Код действителен короткое время. Если вы не запрашивали его — просто
          проигнорируйте это письмо.
        </Text>
        <Text style={footerBrand}>DSOM · Уход за кожей с характером</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
  margin: '0 0 24px',
  fontWeight: 300 as const,
}
const codeWrap = {
  textAlign: 'center' as const,
  padding: '24px',
  backgroundColor: '#ffffff',
  border: '1px solid hsl(32, 14%, 84%)',
  borderRadius: '4px',
  margin: '0 0 32px',
}
const codeStyle = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: '36px',
  fontWeight: 500 as const,
  color: 'hsl(30, 12%, 14%)',
  letterSpacing: '0.3em',
  margin: 0,
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
