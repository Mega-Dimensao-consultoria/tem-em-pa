import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, text } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  companyName?: string
  appUrl?: string
  companyId?: string
}

const Email = ({
  companyName = 'sua empresa',
  appUrl = 'https://tem-em-pa.lovable.app',
  companyId,
}: Props) => {
  const ctaUrl = companyId
    ? `${appUrl}/owner/empresa/${companyId}/dashboard`
    : `${appUrl}/owner`
  return (
    <EmailLayout
      previewText={`${companyName} foi aprovada e já está visível no diretório Tem em P.A.`}
      title="Empresa aprovada e publicada 🎉"
      intro={
        <>
          Ótimas notícias! O cadastro de <strong>{companyName}</strong> passou pela
          nossa moderação e acaba de ser publicado no diretório Tem em P.A. A partir
          de agora, qualquer pessoa que pesquisar por sua categoria, seu nome ou pela
          região vai encontrar a sua empresa.
        </>
      }
      body={
        <>
          <Text style={text}>
            A aprovação significa que verificamos as informações básicas e que o
            cadastro segue as nossas diretrizes de qualidade — endereço plausível,
            categoria correta, descrição adequada e sem conteúdo que viole regras da
            plataforma. Parabéns por dar esse primeiro passo: você acaba de aumentar
            a visibilidade do seu negócio na região de Pouso Alegre.
          </Text>
          <Text style={text}>
            Para aproveitar ao máximo o cadastro, recomendamos completar agora alguns
            itens que costumam fazer muita diferença na conversão de visitantes em
            clientes: adicione uma <strong>logo de boa qualidade</strong>, suba ao
            menos <strong>3 a 6 fotos reais</strong> do espaço, dos produtos ou do
            serviço, e escreva uma <strong>descrição completa</strong> contando
            quem você é, há quanto tempo atua e o que oferece de diferente.
          </Text>
          <Text style={text}>
            Não se esqueça de configurar o <strong>horário de funcionamento</strong>{' '}
            corretamente e de incluir <strong>formas de contato</strong> (WhatsApp,
            telefone, redes sociais). Cadastros completos aparecem com mais destaque
            nas buscas internas e transmitem mais confiança para quem ainda não
            conhece o seu negócio.
          </Text>
          <Text style={text}>
            A partir de agora, sempre que alguém deixar uma avaliação para a sua
            empresa, você receberá um e-mail — e poderá responder publicamente pelo
            painel. Responder com cordialidade e rapidez é um dos hábitos que mais
            ajuda pequenos negócios a construírem reputação online.
          </Text>
        </>
      }
      ctaLabel="Abrir painel da empresa"
      ctaUrl={ctaUrl}
      footnote="Você está recebendo este e-mail porque é o responsável cadastrado por esta empresa no Tem em P.A."
    />
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `${d.companyName || 'Sua empresa'} foi aprovada`,
  displayName: 'Empresa aprovada (dono)',
  previewData: { companyName: 'Padaria Central', companyId: 'demo' },
} satisfies TemplateEntry
