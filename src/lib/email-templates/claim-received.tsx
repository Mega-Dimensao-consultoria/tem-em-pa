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
    previewText={`Pedido de reivindicação para ${companyName}`}
    title="Pedido de reivindicação recebido"
    intro={
      <>
        Um usuário solicitou reivindicar a empresa <strong>{companyName}</strong>.
      </>
    }
    body={
      <>
        Nossa equipe vai analisar os documentos enviados e você será notificado sobre a
        decisão. Caso você seja o real responsável e ainda não tenha confirmado seu
        vínculo, verifique seu cadastro no painel.
      </>
    }
    ctaLabel="Abrir painel do dono"
    ctaUrl={`${appUrl}/owner`}
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Nova reivindicação para ${d.companyName || 'sua empresa'}`,
  displayName: 'Reivindicação recebida (dono atual)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
