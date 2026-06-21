import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  code?: string
  minutes?: number
}

const Email = ({ code = '000000', minutes = 10 }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de recuperação: {code}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Código de recuperação 2FA</Heading>
        <Text style={text}>
          Você solicitou desativar a verificação em duas etapas porque está sem o seu
          dispositivo. Use o código abaixo para confirmar:
        </Text>
        <Section style={codeBox}>
          <Text style={codeText}>{code}</Text>
        </Section>
        <Text style={text}>
          Esse código expira em <strong>{minutes} minutos</strong>. Após inseri-lo, a 2FA
          será removida da sua conta e você poderá configurá-la novamente depois.
        </Text>
        <Text style={muted}>
          Se você não fez essa solicitação, ignore este e-mail e considere alterar sua
          senha.
        </Text>
        <Text style={footer}>Tem em P.A — Megadimensão</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Seu código de recuperação 2FA',
  displayName: 'Recuperação de 2FA',
  previewData: { code: '482913', minutes: 10 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#1f2937', lineHeight: '1.6', margin: '0 0 16px' }
const codeBox = {
  background: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '24px 0',
}
const codeText = {
  fontSize: '32px',
  letterSpacing: '8px',
  fontWeight: 700 as const,
  color: '#0f172a',
  margin: 0,
  fontFamily: 'monospace',
}
const muted = { fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: '16px 0 0' }
const footer = {
  fontSize: '12px',
  color: '#94a3b8',
  marginTop: '32px',
  borderTop: '1px solid #e2e8f0',
  paddingTop: '16px',
}
