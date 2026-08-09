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
  appUrl = 'https://www.temnaminhacidade.com.br',
}: Props) => (
  <EmailLayout
    previewText={`Informação Importante: Pedido de reivindicação para a empresa ${companyName}`}
    title="Recebemos um pedido de reivindicação"
    intro={
      <>
        Olá! Gostaríamos de informar que um usuário da plataforma acaba de enviar um 
        pedido formal para reivindicar a administração da empresa <strong>{companyName}</strong>. 
        Como você consta em nossos registros como o contato atual para este cadastro, 
        estamos notificando você para garantir total transparência em todo o processo.
      </>
    }
    body={
      <>
        <Text style={text}>
          A reivindicação de uma empresa é o procedimento pelo qual um usuário solicita 
          o controle oficial do perfil comercial na nossa plataforma. Isso permite 
          atualizar informações, responder avaliações de clientes e gerenciar fotos. 
          Por ser uma ação de alta relevância, nossa equipe de moderação realizará uma 
          análise criteriosa dos documentos comprobatórios enviados pelo solicitante.
        </Text>
        <Text style={text}>
          Durante este período de validação, que pode levar alguns dias úteis, nenhuma 
          alteração será feita nos dados públicos da sua empresa. Você receberá uma 
          nova notificação assim que a análise for concluída, independentemente do 
          resultado ser aprovação ou recusa.
        </Text>
        <Text style={text}>
          <strong>Importante para você:</strong> Se você é o proprietário legítimo e 
          ainda não validou sua conta no painel administrativo, sugerimos que o faça 
          o quanto antes. Perfis com identidade já confirmada possuem prioridade em 
          nossas análises de segurança e ajudam a prevenir solicitações indevidas.
        </Text>
        <Text style={text}>
          Caso você não reconheça este pedido ou deseje contestar a solicitação de 
          terceiros agora mesmo, sinta-se à vontade para entrar em contato com nossa 
          equipe de suporte especializado.
        </Text>
      </>
    }
    ctaLabel="Gerenciar Minha Empresa"
    ctaUrl={`${appUrl}/owner`}
    footnote="Este e-mail foi enviado automaticamente porque você é o contato de referência para esta empresa na plataforma."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Nova reivindicação para ${d.companyName || 'sua empresa'}`,
  displayName: 'Reivindicação recebida (dono atual)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
