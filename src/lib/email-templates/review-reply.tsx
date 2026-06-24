import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, quote, text } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  companyName?: string
  reply?: string
  appUrl?: string
  companyId?: string
}

const Email = ({
  companyName = 'a empresa',
  reply,
  appUrl = 'https://tem-em-pa.lovable.app',
  companyId,
}: Props) => {
  const ctaUrl = companyId ? `${appUrl}/empresa/${companyId}` : appUrl
  return (
    <EmailLayout
      previewText={`${companyName} respondeu publicamente a sua avaliação no Tem em P.A.`}
      title="O dono respondeu sua avaliação 💬"
      intro={
        <>
          Olá! A empresa <strong>{companyName}</strong> acaba de responder
          publicamente uma avaliação que você deixou no Tem em P.A. Achamos que vale
          a pena te avisar: respostas como essa mostram que o seu feedback foi lido e
          considerado por quem está à frente do negócio.
        </>
      }
      body={
        <>
          <Text style={{ ...text, fontWeight: 600, margin: '0 0 8px' }}>
            Resposta do dono:
          </Text>
          {reply ? (
            <Text style={quote}>“{reply}”</Text>
          ) : (
            <Text style={text}>
              Abra a página da empresa no Tem em P.A. para ler a resposta completa.
            </Text>
          )}
          <Text style={text}>
            Suas avaliações são extremamente importantes para a comunidade de Pouso
            Alegre. Elas ajudam outros visitantes a decidirem onde gastar o dinheiro,
            permitem que negócios bons sejam reconhecidos e dão um sinal claro para
            quem precisa melhorar o atendimento.
          </Text>
          <Text style={text}>
            Se a resposta resolveu a sua questão (ou se a sua opinião sobre o
            atendimento mudou depois desse contato), você pode voltar à página da
            empresa e <strong>atualizar a sua avaliação</strong> a qualquer momento.
            E, claro, sempre que tiver uma nova experiência — boa ou ruim — em
            qualquer estabelecimento da cidade, conte com o Tem em P.A. para
            registrar a sua opinião.
          </Text>
          <Text style={text}>
            Obrigado por contribuir com avaliações honestas. Você está ajudando a
            construir um diretório mais confiável para todo mundo.
          </Text>
        </>
      }
      ctaLabel="Ver no Tem em P.A."
      ctaUrl={ctaUrl}
      footnote="Você está recebendo este e-mail porque deixou uma avaliação para essa empresa no Tem em P.A."
    />
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `${d.companyName || 'A empresa'} respondeu sua avaliação`,
  displayName: 'Resposta do dono (usuário)',
  previewData: {
    companyName: 'Padaria Central',
    reply: 'Obrigado pelo feedback! Voltaremos a melhorar.',
    companyId: 'demo',
  },
} satisfies TemplateEntry
