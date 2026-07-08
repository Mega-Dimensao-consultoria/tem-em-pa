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
    previewText={`O cadastro de ${companyName} não foi aprovado — veja como ajustar e reenviar.`}
    title="Cadastro não aprovado"
    intro={
      <>
        Olá! Analisamos o cadastro da empresa <strong>{companyName}</strong> e, neste
        momento, não conseguimos aprová-lo para publicação no Tem na cidade. Não se
        preocupe: isso não é uma decisão permanente — basta ajustar alguns pontos e
        reenviar para nova análise.
      </>
    }
    body={
      <>
        <Text style={text}>
          O Tem na cidade. é um diretório voltado à comunidade da região de Pouso
          Alegre, e por isso a nossa moderação verifica todos os cadastros antes da
          publicação. Os motivos mais comuns para uma recusa são: informações
          incompletas ou contraditórias, categoria inadequada ao negócio, descrição
          muito curta ou genérica, dados de contato inválidos, imagens com baixa
          qualidade ou de marcas de terceiros, e endereço fora da nossa área de
          cobertura.
        </Text>
        <Text style={text}>
          Antes de reenviar, recomendamos revisar item a item: confirme se o{' '}
          <strong>nome da empresa</strong> está escrito exatamente como aparece nas
          fachadas e redes sociais, se o <strong>endereço</strong> é o correto, se o{' '}
          <strong>telefone</strong> e o <strong>WhatsApp</strong> respondem ativamente,
          e se a <strong>descrição</strong> explica claramente o que você oferece para
          quem nunca te visitou.
        </Text>
        <Text style={text}>
          Uma boa prática é adicionar <strong>fotos reais</strong> (sem marcas d’água
          de bancos de imagem) e um <strong>texto autêntico</strong>, com o tom de voz
          que você usa no dia a dia. Cadastros assim costumam ser aprovados de
          primeira e ainda performam melhor nas buscas internas.
        </Text>
        <Text style={text}>
          Se quiser entender exatamente o que pode ser melhorado no seu caso, entre em
          contato com a nossa equipe pelo formulário de contato do site — vamos te
          orientar com prazer.
        </Text>
      </>
    }
    ctaLabel="Revisar e reenviar cadastro"
    ctaUrl={`${appUrl}/owner`}
    footnote="Você está recebendo este e-mail porque cadastrou esta empresa no Tem na cidade."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Cadastro de ${d.companyName || 'sua empresa'} não aprovado`,
  displayName: 'Empresa rejeitada (dono)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
