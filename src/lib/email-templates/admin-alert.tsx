import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, text, quote } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  alertTitle?: string
  alertMessage?: string
  eventLabel?: string
  link?: string
  appUrl?: string
}

const Email = ({
  alertTitle = 'Novo evento no painel',
  alertMessage = '',
  eventLabel = 'Moderação',
  link = '/admin',
  appUrl = 'https://www.temnaminhacidade.com.br',
}: Props) => (
  <EmailLayout
    previewText={`${eventLabel}: ${alertTitle}`}
    title={alertTitle}
    intro={
      <>
        Você está recebendo este aviso porque é <strong>administrador</strong> do
        Tem na minha cidade. Um novo evento que exige atenção da moderação acabou de
        ser registrado na plataforma.
      </>
    }
    body={
      <>
        <Text style={text}>
          <strong>Tipo do evento:</strong> {eventLabel}
        </Text>
        {alertMessage ? <Text style={quote}>{alertMessage}</Text> : null}
        <Text style={text}>
          Acesse o painel administrativo para analisar o caso, conferir os dados
          enviados e tomar a decisão adequada. Enquanto o item não for tratado, ele
          permanece na fila de pendências do painel.
        </Text>
      </>
    }
    ctaLabel="Abrir painel administrativo"
    ctaUrl={`${appUrl}${link?.startsWith('/') ? link : '/admin'}`}
    footnote="Este aviso é enviado automaticamente para todos os administradores cadastrados no Tem na minha cidade."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `[Admin] ${d.alertTitle || 'Novo evento na plataforma'}`,
  displayName: 'Aviso para administradores',
  previewData: {
    alertTitle: 'Nova reivindicação de empresa',
    alertMessage: 'A empresa Padaria Central recebeu um pedido de reivindicação.',
    eventLabel: 'Reivindicação',
    link: '/admin',
  },
} satisfies TemplateEntry
