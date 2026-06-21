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
    previewText={`Remoção de ${companyName} não aprovada`}
    title="Solicitação de remoção não aprovada"
    intro={
      <>
        Após análise, a empresa <strong>{companyName}</strong> será mantida no
        diretório.
      </>
    }
    body={
      <>
        Se você tem mais informações que comprovem a necessidade de remoção, envie um
        novo pedido com detalhes adicionais e documentos quando possível.
      </>
    }
    ctaLabel="Abrir empresa"
    ctaUrl={appUrl}
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Remoção de ${d.companyName || 'sua empresa'} não aprovada`,
  displayName: 'Remoção rejeitada (solicitante)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
