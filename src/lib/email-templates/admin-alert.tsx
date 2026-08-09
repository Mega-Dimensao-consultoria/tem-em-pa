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
        Você está recebendo este alerta de alta prioridade porque possui privilégios de 
        <strong> administrador</strong> na plataforma. Um novo evento que requer 
        análise imediata da equipe de moderação foi registrado e aguarda sua ação.
      </>
    }
    body={
      <>
        <Text style={text}>
          <strong>Identificação do Evento:</strong> {eventLabel}
        </Text>
        {alertMessage ? <Text style={quote}>{alertMessage}</Text> : null}
        <Text style={text}>
          Recomendamos que você acesse o painel administrativo o quanto antes para 
          conferir os detalhes completos, validar as evidências enviadas e aplicar a 
          decisão necessária conforme nossas diretrizes de comunidade.
        </Text>
        <Text style={text}>
          Lembramos que, enquanto este item não for processado, ele permanecerá na 
          fila de pendências crítica, podendo impactar a experiência dos usuários 
          envolvidos.
        </Text>
      </>
    }
    ctaLabel="Acessar Painel de Controle"
    ctaUrl={`${appUrl}${link?.startsWith('/') ? link : '/admin'}`}
    footnote="Este é um comunicado técnico enviado automaticamente para a equipe de gestão da plataforma."
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
