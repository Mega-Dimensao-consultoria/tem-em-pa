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
    previewText={`Sua reivindicação de ${companyName} não foi aprovada`}
    title="Reivindicação não aprovada"
    intro={
      <>
        Sua solicitação de reivindicação da empresa <strong>{companyName}</strong>{' '}
        não foi aprovada desta vez.
      </>
    }
    body={
      <>
        Verifique se os documentos enviados comprovam o vínculo com o negócio (ex.:
        contrato social, comprovante de endereço comercial, foto da fachada com você
        no local) e tente novamente.
      </>
    }
    ctaLabel="Tentar novamente"
    ctaUrl={`${appUrl}/owner`}
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Reivindicação de ${d.companyName || 'sua empresa'} não aprovada`,
  displayName: 'Reivindicação rejeitada',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
