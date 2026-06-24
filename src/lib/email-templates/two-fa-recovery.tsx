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
    <Preview>Seu código de recuperação 2FA do Tem em P.A.: {code}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Código de recuperação 2FA 🔐</Heading>
        <Text style={text}>
          Você (ou alguém usando sua conta) solicitou a desativação da verificação em
          duas etapas no Tem em P.A. — provavelmente porque está sem acesso ao
          aplicativo autenticador ou ao dispositivo cadastrado. Para concluir esse
          processo com segurança, use o código abaixo na tela de confirmação:
        </Text>
        <Section style={codeBox}>
          <Text style={codeText}>{code}</Text>
        </Section>
        <Text style={text}>
          Esse código é único, pessoal e expira em <strong>{minutes} minutos</strong>.
          Assim que você inseri-lo, a verificação em duas etapas será removida da sua
          conta. <strong>Recomendamos fortemente que você reative a 2FA</strong>{' '}
          logo em seguida, configurando um novo aplicativo autenticador (como
          Google Authenticator, Authy ou 1Password) — a 2FA é a melhor proteção
          contra invasões mesmo que sua senha seja descoberta.
        </Text>
        <Text style={text}>
          <strong>Importante:</strong> nunca compartilhe este código com ninguém,
          mesmo que a pessoa diga ser do nosso suporte. A equipe do Tem em P.A.
          jamais vai te pedir códigos de verificação por telefone, WhatsApp, redes
          sociais ou qualquer outro canal. Se alguém pedir, é tentativa de golpe —
          ignore e nos avise.
        </Text>
        <Text style={muted}>
          Se você <strong>não solicitou</strong> a desativação da 2FA, ignore este
          e-mail e o código não será usado. Mesmo assim, recomendamos{' '}
          <strong>trocar a sua senha</strong> o quanto antes e verificar atividades
          recentes na sua conta, já que o pedido pode indicar uma tentativa de
          acesso indevido.
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
const container = { padding: '32px 24px', maxWidth: '520px', margin: '0 auto' }
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
