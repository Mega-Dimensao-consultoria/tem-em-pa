import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface LayoutProps {
  previewText: string
  title: string
  intro?: React.ReactNode
  body: React.ReactNode
  ctaLabel?: string
  ctaUrl?: string
  footnote?: React.ReactNode
}

export function EmailLayout({
  previewText,
  title,
  intro,
  body,
  ctaLabel,
  ctaUrl,
  footnote,
}: LayoutProps) {
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          {intro ? <Text style={text}>{intro}</Text> : null}
          <Section>{body}</Section>
          {ctaLabel && ctaUrl ? (
            <Section style={ctaBox}>
              <Button href={ctaUrl} style={ctaButton}>
                {ctaLabel}
              </Button>
            </Section>
          ) : null}
          {footnote ? <Text style={muted}>{footnote}</Text> : null}
          <Text style={footer}>Tem em P.A — Megadimensão</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '520px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#0f172a', margin: '0 0 16px', fontWeight: 700 as const }
export const text = {
  fontSize: '15px',
  color: '#1f2937',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
export const quote = {
  fontSize: '15px',
  color: '#0f172a',
  lineHeight: '1.6',
  margin: '0',
  padding: '16px 20px',
  background: '#f8fafc',
  borderLeft: '4px solid #0ea5e9',
  borderRadius: '8px',
}
const ctaBox = { textAlign: 'center' as const, margin: '24px 0' }
const ctaButton = {
  backgroundColor: '#0ea5e9',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '10px',
  textDecoration: 'none',
  fontWeight: 600 as const,
  fontSize: '15px',
  display: 'inline-block',
}
const muted = {
  fontSize: '13px',
  color: '#64748b',
  lineHeight: '1.6',
  margin: '16px 0 0',
}
const footer = {
  fontSize: '12px',
  color: '#94a3b8',
  marginTop: '32px',
  borderTop: '1px solid #e2e8f0',
  paddingTop: '16px',
}
