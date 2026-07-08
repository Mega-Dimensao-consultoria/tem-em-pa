import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, text } from './_layout'
import type { TemplateEntry } from './registry'

interface Props {
  companyName?: string
  appUrl?: string
}

const Email = ({
  companyName = 'a empresa',
  appUrl = 'https://tem-em-pa.lovable.app',
}: Props) => (
  <EmailLayout
    previewText={`Sua reivindicação de ${companyName} foi aprovada — agora você é o dono oficial no Tem na cidade.`}
    title="Reivindicação aprovada 🎉"
    intro={
      <>
        Parabéns! A sua solicitação para reivindicar a empresa{' '}
        <strong>{companyName}</strong> foi analisada pela nossa equipe de moderação e
        oficialmente aprovada. A partir de agora, você é reconhecido como o responsável
        por esse cadastro dentro do diretório Tem na cidade.
      </>
    }
    body={
      <>
        <Text style={text}>
          Isso significa que você passa a ter controle total sobre as informações
          exibidas publicamente: pode atualizar endereço, telefone, horário de
          funcionamento, descrição, formas de pagamento, redes sociais e qualquer outro
          detalhe que ajude os clientes da região de Pouso Alegre a encontrarem o seu
          negócio com mais facilidade.
        </Text>
        <Text style={text}>
          Recomendamos que você comece adicionando uma <strong>logo nítida</strong> e
          algumas <strong>fotos reais</strong> do espaço, dos produtos ou da equipe.
          Cadastros com imagens recebem em média muito mais visitas e cliques de
          contato do que os que ficam apenas com texto. Em seguida, escreva uma
          descrição curta, mas que conte a história do negócio e destaque o que torna
          a sua empresa diferente das outras.
        </Text>
        <Text style={text}>
          Outra função importante liberada agora é a de <strong>responder
          avaliações</strong>. Sempre que um cliente deixar uma nota e um comentário,
          você receberá uma notificação e poderá responder publicamente direto pelo
          painel — agradecer elogios, esclarecer mal-entendidos e mostrar que o
          atendimento continua mesmo depois da venda. Isso fortalece muito a reputação
          do seu negócio na comunidade.
        </Text>
        <Text style={text}>
          Se precisar de ajuda, nossa equipe de suporte está à disposição pelo
          formulário de contato no rodapé do site. Seja bem-vindo(a) oficialmente ao
          Tem na cidade.!
        </Text>
      </>
    }
    ctaLabel="Abrir painel do dono"
    ctaUrl={`${appUrl}/owner`}
    footnote="Você está recebendo este e-mail porque é o responsável confirmado pelo cadastro desta empresa no Tem na cidade."
  />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Reivindicação de ${d.companyName || 'sua empresa'} aprovada`,
  displayName: 'Reivindicação aprovada',
  previewData: { companyName: 'Padaria Central' },
} satisfies TemplateEntry
