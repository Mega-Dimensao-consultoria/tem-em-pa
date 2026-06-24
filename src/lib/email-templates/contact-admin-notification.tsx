import React from 'react'
import { EmailLayout, text, quote } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  fullName?: string
  fromEmail?: string
  subjectLine?: string
  message?: string
  adminUrl?: string
}

const Email = ({
  fullName = 'Visitante',
  fromEmail = '',
  subjectLine = '(sem assunto)',
  message = '',
  adminUrl = 'https://tem-em-pa.lovable.app/admin',
}: Props) => (
  <EmailLayout
    previewText={`Nova mensagem de contato de ${fullName}`}
    title="Nova mensagem no formulário de contato"
    intro={
      <>
        Você recebeu uma nova mensagem de <strong>{fullName}</strong>
        {fromEmail ? <> ({fromEmail})</> : null}.
      </>
    }
    body={
      <>
        <p style={text}><strong>Assunto:</strong> {subjectLine}</p>
        <p style={quote}>{message}</p>
      </>
    }
    ctaLabel="Abrir painel administrativo"
    ctaUrl={adminUrl}
    footnote="Responda este contato pelo painel administrativo para manter o histórico organizado."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `[Contato] ${d.subjectLine || 'Nova mensagem do site'}`,
  displayName: 'Contato — notificação ao administrador',
  previewData: {
    fullName: 'Maria Silva',
    fromEmail: 'maria@exemplo.com',
    subjectLine: 'Dúvida sobre cadastro',
    message: 'Olá, gostaria de saber como cadastrar minha empresa no diretório.',
  },
} satisfies TemplateEntry
