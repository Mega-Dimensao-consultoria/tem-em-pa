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
    previewText={`A empresa ${companyName} foi suspensa do diretório`}
    title="Empresa suspensa"
    intro={
      <>
        A empresa <strong>{companyName}</strong> foi suspensa pela moderação e não está
        mais visível no diretório público.
      </>
    }
    body={
      <>
        Se você acredita que houve um engano ou quer entender o motivo, entre em contato
        com o suporte para revisar a decisão.
      </>
    }
    ctaLabel="Acessar painel do dono"
    ctaUrl={`${appUrl}/owner`}
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Empresa ${d.companyName || 'sua empresa'} foi suspensa`,
  displayName: 'Empresa suspensa (dono)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
