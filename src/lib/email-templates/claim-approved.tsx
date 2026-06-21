import React from 'react'
import { EmailLayout } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  companyName?: string
  appUrl?: string
}

const Email = ({
  companyName = 'a empresa',
  appUrl = 'https://tem-em-pa.lovable.app',
}: Props) => (
  <EmailLayout
    previewText={`Sua reivindicação de ${companyName} foi aprovada`}
    title="Reivindicação aprovada 🎉"
    intro={
      <>
        Parabéns! Sua solicitação de reivindicação da empresa{' '}
        <strong>{companyName}</strong> foi aprovada.
      </>
    }
    body={
      <>
        Agora você já pode editar as informações, adicionar fotos e responder
        avaliações diretamente do seu painel.
      </>
    }
    ctaLabel="Abrir painel"
    ctaUrl={`${appUrl}/owner`}
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Reivindicação de ${d.companyName || 'sua empresa'} aprovada`,
  displayName: 'Reivindicação aprovada',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
