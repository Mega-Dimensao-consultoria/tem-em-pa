import React from 'react'
import { EmailLayout } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  companyName?: string
  appUrl?: string
}

const Email = ({
  companyName = 'sua empresa',
  appUrl = 'https://tem-em-pa.lovable.app',
}: Props) => (
  <EmailLayout
    previewText={`Remoção de ${companyName} aprovada`}
    title="Solicitação de remoção aprovada"
    intro={
      <>
        A empresa <strong>{companyName}</strong> foi removida do diretório após sua
        solicitação.
      </>
    }
    body={<>Obrigado por nos ajudar a manter as informações corretas e atualizadas.</>}
    ctaLabel="Voltar ao site"
    ctaUrl={appUrl}
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Remoção de ${d.companyName || 'sua empresa'} aprovada`,
  displayName: 'Remoção aprovada (solicitante)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
