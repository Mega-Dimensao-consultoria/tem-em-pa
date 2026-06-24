import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, text } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  companyName?: string
  appUrl?: string
}

const Email = ({
  companyName = 'a empresa',
  appUrl = 'https://tem-em-pa.lovable.app',
}: Props) => (
  <EmailLayout
    previewText={`Sua reivindicação de ${companyName} não foi aprovada — veja como tentar de novo.`}
    title="Reivindicação não aprovada"
    intro={
      <>
        Olá. Avaliamos com atenção a sua solicitação para reivindicar a empresa{' '}
        <strong>{companyName}</strong> e, desta vez, não conseguimos aprovar o pedido.
        Sabemos que isso pode ser frustrante, então preparamos abaixo as orientações
        para você entender o motivo e tentar novamente com mais chances de sucesso.
      </>
    }
    body={
      <>
        <Text style={text}>
          O processo de reivindicação existe para proteger todos os negócios listados
          no Tem em P.A. Como qualquer pessoa pode tentar assumir um cadastro, nós só
          aprovamos pedidos quando temos evidências claras de que o solicitante é o
          dono, sócio ou representante legal do estabelecimento. Se as informações
          enviadas não foram suficientes para comprovar esse vínculo, o pedido é
          recusado.
        </Text>
        <Text style={text}>
          Para uma nova tentativa, recomendamos reunir pelo menos um destes
          documentos: <strong>contrato social</strong> ou <strong>CNPJ ativo</strong>{' '}
          em que apareça o seu nome; <strong>comprovante de endereço comercial</strong>{' '}
          no mesmo endereço cadastrado; ou uma <strong>foto da fachada</strong> com
          você visível no local junto a algum documento pessoal. Quanto mais provas
          objetivas, mais rápida e segura é a análise.
        </Text>
        <Text style={text}>
          Vale lembrar que reivindicações feitas com e-mails do mesmo domínio do
          negócio (por exemplo, contato@suaempresa.com.br) também ajudam a acelerar
          o processo. Se você tem esse e-mail, prefira usá-lo na próxima tentativa.
        </Text>
        <Text style={text}>
          Caso ache que houve algum engano na análise, entre em contato com a nossa
          equipe pelo formulário de contato — vamos revisar o caso com prazer.
        </Text>
      </>
    }
    ctaLabel="Tentar novamente"
    ctaUrl={`${appUrl}/owner`}
    footnote="Você está recebendo este e-mail porque enviou um pedido de reivindicação no Tem em P.A."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Reivindicação de ${d.companyName || 'sua empresa'} não aprovada`,
  displayName: 'Reivindicação rejeitada',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
