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
  appUrl = 'https://tem-em-pa.lovable.app',
}: Props) => (
  <EmailLayout
    previewText={`Sua solicitação de remoção de ${companyName} foi aprovada.`}
    title="Solicitação de remoção aprovada"
    intro={
      <>
        Olá! O seu pedido de remoção da empresa <strong>{companyName}</strong> foi
        analisado pela nossa equipe de moderação e aprovado. A partir de agora, esse
        cadastro deixa de aparecer no diretório Tem em P.A. e em todas as listagens
        públicas da plataforma.
      </>
    }
    body={
      <>
        <Text style={text}>
          Aprovamos pedidos de remoção quando há evidências consistentes de que o
          cadastro precisava ser retirado — seja porque o negócio encerrou as
          atividades, porque as informações estavam significativamente desatualizadas
          e sem manutenção, porque havia conflito com as nossas diretrizes, ou
          porque o responsável legal solicitou a retirada de forma legítima.
        </Text>
        <Text style={text}>
          Em nome de toda a comunidade do Tem em P.A., <strong>muito obrigado</strong>{' '}
          por colaborar para que o diretório se mantenha confiável e atualizado.
          Cada denúncia bem fundamentada ajuda outros moradores e visitantes da
          região de Pouso Alegre a tomarem decisões melhores no dia a dia.
        </Text>
        <Text style={text}>
          Se no futuro você identificar outras situações parecidas — empresas que
          fecharam, endereços trocados, informações claramente incorretas ou
          condutas que ferem as regras da plataforma — fique à vontade para abrir
          novos pedidos. A moderação está sempre atenta a esses sinais.
        </Text>
        <Text style={text}>
          Em caso de dúvida ou se quiser conversar sobre o resultado, é só responder
          este e-mail ou usar o formulário de contato no site.
        </Text>
      </>
    }
    ctaLabel="Voltar ao Tem em P.A."
    ctaUrl={appUrl}
    footnote="Você está recebendo este e-mail porque solicitou a remoção dessa empresa no Tem em P.A."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Remoção de ${d.companyName || 'sua empresa'} aprovada`,
  displayName: 'Remoção aprovada (solicitante)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
