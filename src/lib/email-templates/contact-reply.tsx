import React from 'react'
import { EmailLayout, text, quote } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  fullName?: string
  subjectLine?: string
  originalMessage?: string
  reply?: string
}

const Email = ({
  fullName = '',
  subjectLine = 'sua mensagem',
  originalMessage = '',
  reply = '',
}: Props) => (
  <EmailLayout
    previewText={`Resposta da equipe sobre: ${subjectLine}`}
    title="Recebemos sua mensagem e respondemos"
    intro={
      <>
        Olá{fullName ? <>, <strong>{fullName}</strong></> : null}! Obrigado por entrar em
        contato. Segue abaixo a resposta da nossa equipe sobre <strong>{subjectLine}</strong>.
      </>
    }
    body={
      <>
        <p style={{ ...text, fontWeight: 600 }}>Nossa resposta:</p>
        <p style={quote}>{reply}</p>
        {originalMessage ? (
          <>
            <p style={{ ...text, marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
              Sua mensagem original:
            </p>
            <p style={{ ...quote, background: '#f1f5f9', borderLeftColor: '#cbd5e1', fontSize: '14px' }}>
              {originalMessage}
            </p>
          </>
        ) : null}
      </>
    }
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Resposta: ${d.subjectLine || 'sua mensagem de contato'}`,
  displayName: 'Contato — resposta ao remetente',
  previewData: {
    fullName: 'Maria Silva',
    subjectLine: 'Dúvida sobre cadastro',
    originalMessage: 'Olá, gostaria de saber como cadastrar minha empresa.',
    reply: 'Olá Maria! Basta acessar a página de cadastro de empresa no nosso site.',
  },
} satisfies TemplateEntry
