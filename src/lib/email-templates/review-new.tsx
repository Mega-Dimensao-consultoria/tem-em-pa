import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, quote, text } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  companyName?: string
  rating?: number
  comment?: string | null
  appUrl?: string
  companyId?: string
}

const Email = ({
  companyName = 'sua empresa',
  rating = 5,
  comment,
  appUrl = 'https://tem-em-pa.lovable.app',
  companyId,
}: Props) => {
  const stars = '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating))
  const ctaUrl = companyId
    ? `${appUrl}/owner/empresa/${companyId}/dashboard`
    : `${appUrl}/owner`
  return (
    <EmailLayout
      previewText={`Nova avaliação de ${rating} estrela(s) em ${companyName}`}
      title="Nova avaliação recebida"
      intro={
        <>
          Sua empresa <strong>{companyName}</strong> recebeu uma nova avaliação de{' '}
          <strong>{rating} estrela(s)</strong>.
        </>
      }
      body={
        <>
          <Text style={{ ...text, fontSize: '20px', letterSpacing: '4px', color: '#f59e0b', margin: '0 0 12px' }}>
            {stars}
          </Text>
          {comment ? <Text style={quote}>“{comment}”</Text> : null}
        </>
      }
      ctaLabel="Responder no painel"
      ctaUrl={ctaUrl}
      footnote="Responder rapidamente a avaliações ajuda a fortalecer a reputação do seu negócio."
    />
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Nova avaliação ${d.rating ? `(${d.rating}★) ` : ''}em ${d.companyName || 'sua empresa'}`,
  displayName: 'Nova avaliação (dono)',
  previewData: {
    companyName: 'Padaria Central',
    rating: 4,
    comment: 'Pão fresquinho e atendimento ótimo.',
    companyId: 'demo',
  },
} satisfies TemplateEntry
