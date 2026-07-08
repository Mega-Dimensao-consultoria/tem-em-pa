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
  appUrl = 'https://temnacidade.com',
}: Props) => (
  <EmailLayout
    previewText={`A empresa ${companyName} foi removida do diretório Tem na cidade.`}
    title="Empresa removida do diretório"
    intro={
      <>
        Olá. Estamos te avisando que a empresa <strong>{companyName}</strong> foi
        removida do diretório Tem na cidade. A partir deste momento ela deixa de
        aparecer nas buscas, nas listagens por categoria e nos resultados públicos do
        site.
      </>
    }
    body={
      <>
        <Text style={text}>
          A remoção pode ocorrer por diferentes motivos: solicitação do próprio
          responsável, pedido fundamentado de terceiros, encerramento confirmado do
          negócio, descumprimento repetido das regras da plataforma ou após o
          encerramento de um processo de moderação. Em todos os casos, a decisão é
          tomada com base nas informações disponíveis no momento.
        </Text>
        <Text style={text}>
          Se o seu negócio continua em atividade e a remoção <strong>não</strong> foi
          solicitada por você, é provável que tenhamos recebido uma denúncia ou
          identificado um sinal que precisava ser revisto. Nesses casos, você pode
          entrar em contato com a nossa equipe de suporte para apresentar provas de
          atividade — como nota fiscal recente, redes sociais ativas, contrato social
          atualizado — e pedir o restabelecimento do cadastro.
        </Text>
        <Text style={text}>
          Caso prefira simplesmente <strong>recomeçar</strong> com um cadastro novo,
          também é possível. Basta acessar o painel do dono, criar um novo perfil
          para a empresa e enviar para moderação. Recomendamos aproveitar a
          oportunidade para subir fotos atualizadas, revisar a descrição e configurar
          desde o início o horário e os meios de contato.
        </Text>
        <Text style={text}>
          Lamentamos qualquer transtorno. Se tiver dúvidas ou quiser entender o
          motivo específico da remoção, fale com a gente pelo formulário de contato —
          vamos te responder o mais rápido possível.
        </Text>
      </>
    }
    ctaLabel="Falar com o suporte"
    ctaUrl={`${appUrl}/contato`}
    footnote="Você está recebendo este e-mail porque era o responsável cadastrado por esta empresa no Tem na cidade."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Empresa ${d.companyName || 'sua empresa'} foi removida`,
  displayName: 'Empresa removida (dono)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
