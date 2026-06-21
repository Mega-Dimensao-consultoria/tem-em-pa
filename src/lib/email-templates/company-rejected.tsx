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
    previewText={`O cadastro de ${companyName} não foi aprovado`}
    title="Cadastro não aprovado"
    intro={
      <>
        O cadastro da empresa <strong>{companyName}</strong> não foi aprovado desta vez.
      </>
    }
    body={
      <>
        Revise as informações fornecidas — em especial endereço, contato e descrição —
        e envie novamente. Em caso de dúvida, entre em contato com nosso suporte.
      </>
    }
    ctaLabel="Revisar cadastro"
    ctaUrl={`${appUrl}/owner`}
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Cadastro de ${d.companyName || 'sua empresa'} não aprovado`,
  displayName: 'Empresa rejeitada (dono)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
