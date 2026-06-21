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
    previewText={`Solicitação de remoção para ${companyName}`}
    title="Solicitação de remoção recebida"
    intro={
      <>
        Um usuário solicitou a remoção da empresa <strong>{companyName}</strong> do
        diretório.
      </>
    }
    body={
      <>
        Nossa moderação vai analisar o pedido. Se a empresa ainda está ativa, mantenha
        as informações atualizadas (endereço, telefone, horário) para evitar confusões
        e dar mais credibilidade ao seu cadastro.
      </>
    }
    ctaLabel="Atualizar cadastro"
    ctaUrl={`${appUrl}/owner`}
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Pedido de remoção para ${d.companyName || 'sua empresa'}`,
  displayName: 'Pedido de remoção recebido (dono)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
