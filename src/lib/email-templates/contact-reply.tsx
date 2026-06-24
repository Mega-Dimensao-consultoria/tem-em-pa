import React from 'react'
import { Text } from '@react-email/components'
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
    previewText={`Resposta da equipe do Tem em P.A. sobre: ${subjectLine}`}
    title="Resposta da equipe Tem em P.A."
    intro={
      <>
        Olá{fullName ? <>, <strong>{fullName}</strong></> : null}! Obrigado por entrar
        em contato pelo formulário do site. Recebemos a sua mensagem sobre{' '}
        <strong>{subjectLine}</strong> e nossa equipe preparou uma resposta. Confira
        abaixo.
      </>
    }
    body={
      <>
        <Text style={{ ...text, fontWeight: 600, margin: '0 0 8px' }}>
          Nossa resposta:
        </Text>
        <Text style={quote}>{reply}</Text>
        {originalMessage ? (
          <>
            <Text style={{ ...text, marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
              Sua mensagem original (para referência):
            </Text>
            <Text style={{ ...quote, background: '#f1f5f9', borderLeftColor: '#cbd5e1', fontSize: '14px' }}>
              {originalMessage}
            </Text>
          </>
        ) : null}
        <Text style={text}>
          Se a resposta acima resolveu a sua dúvida, ótimo — ficamos felizes em ter
          ajudado! Caso ainda tenha alguma questão em aberto, queira esclarecer
          algum ponto ou precise nos dar mais contexto, é só responder este e-mail
          ou enviar uma nova mensagem pelo formulário de contato do site. Nossa
          equipe vai dar continuidade ao atendimento normalmente.
        </Text>
        <Text style={text}>
          O Tem em P.A. é um projeto independente voltado para a comunidade de Pouso
          Alegre e região. Cada mensagem recebida ajuda a melhorar o serviço, então
          fique à vontade para enviar sugestões, denunciar informações incorretas
          sobre empresas listadas, pedir o cadastro do seu próprio negócio ou
          simplesmente comentar a sua experiência usando o diretório.
        </Text>
        <Text style={text}>
          Obrigado novamente pelo seu contato e por usar o Tem em P.A.!
        </Text>
      </>
    }
    footnote="Esta é a resposta oficial da nossa equipe ao contato que você enviou pelo formulário do site Tem em P.A."
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
