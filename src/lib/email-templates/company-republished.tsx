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
    previewText={`A empresa ${companyName} voltou ao diretório`}
    title="Empresa republicada"
    intro={
      <>
        Boas notícias! A empresa <strong>{companyName}</strong> voltou a ser exibida no
        diretório público.
      </>
    }
    body={
      <>
        Aproveite para revisar as informações, atualizar fotos e responder eventuais
        avaliações recebidas durante a suspensão.
      </>
    }
    ctaLabel="Abrir painel do dono"
    ctaUrl={`${appUrl}/owner`}
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Empresa ${d.companyName || 'sua empresa'} voltou ao diretório`,
  displayName: 'Empresa republicada (dono)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
