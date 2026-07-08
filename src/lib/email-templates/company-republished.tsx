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
    previewText={`A empresa ${companyName} voltou a ser exibida no Tem na cidade.`}
    title="Empresa republicada 🎉"
    intro={
      <>
        Boas notícias! Após revisão, a empresa <strong>{companyName}</strong> voltou
        a ser publicada no diretório Tem na cidade. e já está visível novamente para
        todos os visitantes da plataforma.
      </>
    }
    body={
      <>
        <Text style={text}>
          A suspensão foi encerrada porque a equipe de moderação confirmou que os
          ajustes necessários foram feitos ou que a denúncia que originou a pausa não
          se sustentou após a análise. Em outras palavras: está tudo certo para o seu
          cadastro continuar ativo normalmente.
        </Text>
        <Text style={text}>
          Aproveite este momento para fazer uma <strong>revisão geral</strong> nas
          informações do perfil. Verifique se o endereço, o telefone, o WhatsApp e o
          horário continuam corretos, se a descrição reflete os serviços que você
          oferece hoje e se as fotos estão recentes. Atualizações periódicas ajudam o
          cadastro a se manter relevante nas buscas internas.
        </Text>
        <Text style={text}>
          Vale a pena conferir também se chegou alguma <strong>avaliação</strong>{' '}
          enquanto a empresa esteve suspensa — você pode responder publicamente pelo
          painel, agradecendo os elogios e esclarecendo eventuais críticas. Esse
          contato humano costuma fazer toda a diferença para visitantes que ainda não
          conhecem o seu negócio.
        </Text>
        <Text style={text}>
          Obrigado pela paciência durante a revisão e bem-vindo(a) de volta ao
          ar! Estamos aqui para o que precisar.
        </Text>
      </>
    }
    ctaLabel="Abrir painel do dono"
    ctaUrl={`${appUrl}/owner`}
    footnote="Você está recebendo este e-mail porque é o responsável cadastrado por esta empresa no Tem na cidade."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Empresa ${d.companyName || 'sua empresa'} voltou ao diretório`,
  displayName: 'Empresa republicada (dono)',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
