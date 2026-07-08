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
    previewText={`A empresa ${companyName} foi temporariamente suspensa no Tem na cidade.`}
    title="Empresa suspensa temporariamente"
    intro={
      <>
        Olá. Estamos te avisando que a empresa <strong>{companyName}</strong> foi
        suspensa pela nossa equipe de moderação e, por enquanto, não aparece mais nas
        buscas nem na listagem pública do Tem na cidade.
      </>
    }
    body={
      <>
        <Text style={text}>
          A suspensão é uma medida cautelar — não significa exclusão definitiva. Ela
          acontece quando recebemos denúncias relevantes, quando identificamos
          informações que parecem incorretas ou desatualizadas, quando há indícios de
          violação das regras da comunidade, ou quando algum dado essencial precisa
          ser revisto antes que o cadastro continue público.
        </Text>
        <Text style={text}>
          Durante a suspensão, o painel do dono continua acessível. Você ainda pode
          visualizar e editar as informações, mas nada disso fica visível para os
          visitantes até que a situação seja regularizada e o cadastro seja
          republicado pela moderação.
        </Text>
        <Text style={text}>
          Para acelerar a revisão, recomendamos: confirmar se o{' '}
          <strong>endereço</strong>, o <strong>telefone</strong> e o{' '}
          <strong>horário</strong> estão corretos; verificar se a{' '}
          <strong>categoria</strong> escolhida realmente representa o seu negócio;
          remover textos ou imagens que possam ferir direitos de terceiros; e
          atualizar fotos antigas. Quanto mais coerente e atualizado o cadastro,
          maior a chance de ele voltar a ser publicado rapidamente.
        </Text>
        <Text style={text}>
          Se você acredita que houve um engano ou quer entender em detalhe o motivo
          específico da suspensão, entre em contato com a nossa equipe de suporte.
          Estamos disponíveis para conversar e revisar a decisão sempre que houver
          informação nova relevante.
        </Text>
      </>
    }
    ctaLabel="Acessar painel do dono"
    ctaUrl={`${appUrl}/owner`}
    footnote="Você está recebendo este e-mail porque é o responsável cadastrado por esta empresa no Tem na cidade."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Empresa ${d.companyName || 'sua empresa'} foi suspensa`,
  displayName: 'Empresa suspensa (dono)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
