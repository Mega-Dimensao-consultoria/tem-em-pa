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
    previewText={`A empresa ${companyName} foi removida do diretório`}
    title="Empresa removida"
    intro={
      <>
        A empresa <strong>{companyName}</strong> foi removida permanentemente do
        diretório pela moderação.
      </>
    }
    body={
      <>
        Se você quiser cadastrá-la novamente ou entender o motivo da remoção, entre em
        contato com o suporte.
      </>
    }
    ctaLabel="Falar com o suporte"
    ctaUrl={`${appUrl}/contato`}
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Empresa ${d.companyName || 'sua empresa'} foi removida`,
  displayName: 'Empresa removida (dono)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
