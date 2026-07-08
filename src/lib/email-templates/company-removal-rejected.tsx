import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, text } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  companyName?: string
  appUrl?: string
}

const Email = ({
  companyName = 'sua empresa',
  appUrl = 'https://pousoalegre.megadimensao.com.br',
}: Props) => (
  <EmailLayout
    previewText={`Sua solicitação de remoção de ${companyName} não foi aprovada.`}
    title="Solicitação de remoção não aprovada"
    intro={
      <>
        Olá. Analisamos com atenção o seu pedido para remover o cadastro da empresa{' '}
        <strong>{companyName}</strong> do diretório Tem na cidade. e, após a análise,
        decidimos <strong>manter</strong> a empresa publicada por enquanto. Abaixo
        explicamos como funciona o processo e como você pode reforçar a sua
        solicitação, se ainda fizer sentido.
      </>
    }
    body={
      <>
        <Text style={text}>
          Remover um cadastro do diretório é uma decisão delicada: ela afeta tanto
          quem busca informações sobre o negócio quanto o próprio responsável pela
          empresa. Por isso, só aprovamos pedidos quando há indícios claros de que a
          remoção é o caminho correto — por exemplo, encerramento confirmado das
          atividades, informações comprovadamente incorretas e sem possibilidade de
          correção, ou violação clara das regras da plataforma.
        </Text>
        <Text style={text}>
          No seu caso, as evidências enviadas ainda não foram suficientes para
          justificar a remoção. Isso pode acontecer quando a empresa segue
          aparentemente ativa (com redes sociais publicando recentemente, telefone
          atendendo ou avaliações novas), quando o pedido descreve uma situação que
          pode ser resolvida com atualização do cadastro, ou quando faltam
          informações concretas que sustentem o pedido.
        </Text>
        <Text style={text}>
          Se você tem mais dados que reforcem o pedido — como{' '}
          <strong>foto do estabelecimento fechado</strong>, comprovante de
          encerramento, publicação oficial, ou registros que mostrem que o negócio
          mudou completamente de identidade — envie uma nova solicitação anexando
          essas informações. Quanto mais objetivas as provas, mais rápida e precisa
          fica a análise.
        </Text>
        <Text style={text}>
          Obrigado por colaborar com a qualidade do Tem na cidade. Estamos sempre
          disponíveis pelo formulário de contato caso queira conversar sobre o caso.
        </Text>
      </>
    }
    ctaLabel="Abrir empresa no diretório"
    ctaUrl={appUrl}
    footnote="Você está recebendo este e-mail porque enviou um pedido de remoção no Tem na cidade."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Remoção de ${d.companyName || 'sua empresa'} não aprovada`,
  displayName: 'Remoção rejeitada (solicitante)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
