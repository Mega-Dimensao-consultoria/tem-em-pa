import React from 'react'
import { Text } from '@react-email/components'
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
  adminUrl = 'https://temnacidade.com/admin',
}: Props) => (
  <EmailLayout
    previewText={`Nova mensagem de contato de ${fullName} no Tem na cidade.`}
    title="Nova mensagem no formulário de contato"
    intro={
      <>
        Você recebeu uma nova mensagem enviada pelo formulário público de contato do
        Tem na cidade. Abaixo estão os dados do remetente e o conteúdo completo da
        mensagem para análise e resposta.
      </>
    }
    body={
      <>
        <Text style={text}><strong>Nome completo:</strong> {fullName}</Text>
        {fromEmail ? (
          <Text style={text}><strong>E-mail de retorno:</strong> {fromEmail}</Text>
        ) : null}
        <Text style={text}><strong>Assunto:</strong> {subjectLine}</Text>
        <Text style={{ ...text, fontWeight: 600, margin: '16px 0 8px' }}>
          Mensagem enviada:
        </Text>
        <Text style={quote}>{message}</Text>
        <Text style={text}>
          Recomendamos responder pelo <strong>painel administrativo</strong> em vez
          de responder direto neste e-mail. Ao responder pelo painel, a resposta fica
          registrada no histórico da mensagem, o remetente recebe um e-mail formatado
          com a identidade visual do Tem na cidade. e o status do contato é atualizado
          automaticamente para “respondido”.
        </Text>
        <Text style={text}>
          Mensagens vindas do formulário público costumam ser de três tipos: dúvidas
          sobre como cadastrar uma empresa, denúncias ou correções de informações
          sobre negócios já listados, e pedidos de parceria. Tente identificar a
          natureza do contato antes de responder para oferecer a orientação mais
          adequada — e, sempre que for o caso, encaminhe o usuário para a página
          específica do site (cadastro, painel do dono, FAQ etc.).
        </Text>
      </>
    }
    ctaLabel="Abrir painel administrativo"
    ctaUrl={adminUrl}
    footnote="Esta mensagem foi gerada automaticamente a partir do formulário público de contato do Tem na cidade."
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
