import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, quote } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  companyName?: string
  reply?: string
  appUrl?: string
  companyId?: string
}

const Email = ({
  companyName = 'a empresa',
  reply,
  appUrl = 'https://tem-em-pa.lovable.app',
  companyId,
}: Props) => {
  const ctaUrl = companyId ? `${appUrl}/empresa/${companyId}` : appUrl
  return (
    <EmailLayout
      previewText={`${companyName} respondeu sua avaliação`}
      title="O dono respondeu sua avaliação"
      intro={
        <>
          A empresa <strong>{companyName}</strong> respondeu a uma avaliação que você
          deixou. Veja a resposta abaixo:
        </>
      }
      body={
        reply ? (
          <Text style={quote}>“{reply}”</Text>
        ) : (
          <Text>Abra o app para ler a resposta completa.</Text>
        )
      }
      ctaLabel="Ver no app"
      ctaUrl={ctaUrl}
    />
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `${d.companyName || 'A empresa'} respondeu sua avaliação`,
  displayName: 'Resposta do dono (usuário)',
  previewData: {
    companyName: 'Padaria Central',
    reply: 'Obrigado pelo feedback! Voltaremos a melhorar.',
    companyId: 'demo',
  },
} satisfies TemplateEntry
