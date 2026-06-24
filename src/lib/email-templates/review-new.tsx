import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, quote, text } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  companyName?: string
  rating?: number
  comment?: string | null
  appUrl?: string
  companyId?: string
}

const Email = ({
  companyName = 'sua empresa',
  rating = 5,
  comment,
  appUrl = 'https://tem-em-pa.lovable.app',
  companyId,
}: Props) => {
  const stars = '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating))
  const ctaUrl = companyId
    ? `${appUrl}/owner/empresa/${companyId}/dashboard`
    : `${appUrl}/owner`
  return (
    <EmailLayout
      previewText={`Sua empresa ${companyName} recebeu uma nova avaliação de ${rating} estrela(s).`}
      title="Nova avaliação recebida ⭐"
      intro={
        <>
          Uma boa notícia: a sua empresa <strong>{companyName}</strong> acaba de
          receber uma nova avaliação de <strong>{rating} estrela(s)</strong> no Tem em
          P.A. Cada avaliação ajuda outros visitantes da plataforma a decidirem onde
          comprar, comer ou contratar — e é também uma chance valiosa de você se
          conectar com o cliente.
        </>
      }
      body={
        <>
          <Text style={{ ...text, fontSize: '24px', letterSpacing: '4px', color: '#f59e0b', margin: '0 0 16px' }}>
            {stars}
          </Text>
          {comment ? <Text style={quote}>“{comment}”</Text> : (
            <Text style={text}>
              O cliente não deixou um comentário escrito — apenas a nota em estrelas.
            </Text>
          )}
          <Text style={text}>
            Recomendamos fortemente <strong>responder publicamente</strong> a essa
            avaliação direto pelo painel do dono. Avaliações com resposta passam uma
            imagem muito melhor para quem está pesquisando o seu negócio pela
            primeira vez: mostram que existe alguém atento por trás do balcão e
            preocupado com a experiência de cada cliente.
          </Text>
          <Text style={text}>
            Algumas boas práticas para a resposta: agradeça pelo tempo do cliente,
            chame-o pelo nome quando possível, mencione algum detalhe específico do
            comentário e — se for o caso — convide-o para voltar. Se a avaliação for
            crítica, mantenha a cordialidade, evite ficar na defensiva, reconheça o
            que pode ser melhorado e ofereça uma forma direta de continuar a
            conversa fora da plataforma.
          </Text>
          <Text style={text}>
            Responder logo, com tom humano e sem respostas automáticas prontas, é um
            dos hábitos que mais transformam um perfil comum em uma referência local
            de confiança.
          </Text>
        </>
      }
      ctaLabel="Responder no painel"
      ctaUrl={ctaUrl}
      footnote="Você está recebendo este e-mail porque é o responsável cadastrado por esta empresa no Tem em P.A."
    />
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Nova avaliação ${d.rating ? `(${d.rating}★) ` : ''}em ${d.companyName || 'sua empresa'}`,
  displayName: 'Nova avaliação (dono)',
  previewData: {
    companyName: 'Padaria Central',
    rating: 4,
    comment: 'Pão fresquinho e atendimento ótimo.',
    companyId: 'demo',
  },
} satisfies TemplateEntry
