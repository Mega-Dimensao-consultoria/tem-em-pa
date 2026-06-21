import React from 'react'
import { EmailLayout } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  companyName?: string
  appUrl?: string
  companyId?: string
}

const Email = ({
  companyName = 'sua empresa',
  appUrl = 'https://tem-em-pa.lovable.app',
  companyId,
}: Props) => {
  const ctaUrl = companyId
    ? `${appUrl}/owner/empresa/${companyId}/dashboard`
    : `${appUrl}/owner`
  return (
    <EmailLayout
      previewText={`${companyName} foi aprovada e já está publicada`}
      title="Empresa aprovada e publicada 🎉"
      intro={
        <>
          Sua empresa <strong>{companyName}</strong> acaba de ser aprovada e já está
          visível para todos os usuários.
        </>
      }
      body={
        <>
          Aproveite para completar o cadastro: adicione logo, fotos, descrição
          detalhada e horário de funcionamento para atrair mais clientes.
        </>
      }
      ctaLabel="Abrir painel da empresa"
      ctaUrl={ctaUrl}
    />
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `${d.companyName || 'Sua empresa'} foi aprovada`,
  displayName: 'Empresa aprovada (dono)',
  previewData: { companyName: 'Padaria Central', companyId: 'demo' },
} satisfies TemplateEntry
