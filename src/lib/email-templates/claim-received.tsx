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
    previewText={`Recebemos um pedido para reivindicar a empresa ${companyName} no Tem na cidade.`}
    title="Pedido de reivindicação recebido"
    intro={
      <>
        Olá! Um usuário do Tem na cidade. acaba de enviar um pedido formal para reivindicar
        a empresa <strong>{companyName}</strong>. Como você consta no nosso sistema
        como contato relacionado a esse cadastro, estamos te avisando para que tudo
        seja resolvido com transparência.
      </>
    }
    body={
      <>
        <Text style={text}>
          Reivindicar uma empresa significa pedir para assumir oficialmente a
          administração do cadastro — passando a poder editar dados, responder
          avaliações e gerenciar fotos. Por isso, antes de qualquer alteração, nossa
          equipe vai analisar os documentos enviados pelo solicitante para confirmar
          o vínculo real com o negócio (como contrato social, comprovantes de endereço
          comercial ou registros equivalentes).
        </Text>
        <Text style={text}>
          Esse processo costuma levar até alguns dias úteis. Assim que houver uma
          decisão — aprovada ou recusada — você receberá um novo e-mail explicando o
          resultado. Enquanto isso, nenhuma informação pública da empresa é alterada.
        </Text>
        <Text style={text}>
          <strong>Se você é o verdadeiro responsável</strong> pela empresa e ainda não
          confirmou o seu vínculo no painel, recomendamos que faça isso agora.
          Cadastros confirmados têm prioridade na análise e ajudam a evitar
          reivindicações indevidas por terceiros. Você também pode anexar documentos
          adicionais que comprovem a sua relação com o negócio.
        </Text>
        <Text style={text}>
          Caso não reconheça esse pedido ou queira contestá-lo, entre em contato com
          nossa equipe de suporte o quanto antes para registrar a sua manifestação.
        </Text>
      </>
    }
    ctaLabel="Abrir painel do dono"
    ctaUrl={`${appUrl}/owner`}
    footnote="Você está recebendo este e-mail porque consta como contato vinculado a este cadastro no Tem na cidade."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Nova reivindicação para ${d.companyName || 'sua empresa'}`,
  displayName: 'Reivindicação recebida (dono atual)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
