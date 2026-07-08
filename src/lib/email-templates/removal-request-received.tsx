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
    previewText={`Um usuário pediu a remoção da empresa ${companyName} no Tem na cidade.`}
    title="Pedido de remoção recebido"
    intro={
      <>
        Olá. Recebemos um pedido formal de um usuário do Tem na cidade. solicitando a
        remoção do cadastro da empresa <strong>{companyName}</strong> do nosso
        diretório. Como você é o responsável atual por essa página, estamos te
        avisando para que possa se manifestar antes de qualquer decisão.
      </>
    }
    body={
      <>
        <Text style={text}>
          Pedidos de remoção podem acontecer por vários motivos: alguém acreditar que
          o negócio encerrou as atividades, identificar informações desatualizadas,
          relatar atendimento ruim de forma sistemática ou apontar possíveis
          violações das regras da plataforma. Em todos os casos, antes de qualquer
          ação definitiva, nossa equipe analisa cuidadosamente o pedido e considera o
          seu ponto de vista como dono.
        </Text>
        <Text style={text}>
          <strong>O que você pode fazer agora:</strong> acesse o painel do dono e
          confirme se as informações principais estão corretas e atualizadas. Em
          especial: endereço, telefone, WhatsApp, horário de funcionamento, descrição
          e fotos. Cadastros bem mantidos transmitem credibilidade e reduzem
          drasticamente a chance de a remoção ser aprovada.
        </Text>
        <Text style={text}>
          Se a sua empresa <strong>continua ativa</strong> e o pedido parece ter sido
          enviado por engano (ou de má-fé), você não precisa fazer nada além de
          manter o cadastro em dia — a moderação vai considerar isso na avaliação.
          Você também pode incluir informações complementares no painel para reforçar
          a sua posição.
        </Text>
        <Text style={text}>
          Caso prefira <strong>realmente encerrar</strong> o cadastro (porque o
          negócio fechou ou mudou de marca, por exemplo), é só nos responder ou
          entrar em contato pelo formulário do site — a remoção é feita rapidamente
          em situações assim.
        </Text>
      </>
    }
    ctaLabel="Atualizar cadastro"
    ctaUrl={`${appUrl}/owner`}
    footnote="Você está recebendo este e-mail porque é o responsável cadastrado por esta empresa no Tem na cidade."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Pedido de remoção para ${d.companyName || 'sua empresa'}`,
  displayName: 'Pedido de remoção recebido (dono)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
