import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Convite especial: Junte-se ao {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Você Recebeu um Convite!</Heading>
        <Text style={text}>
          Temos ótimas notícias! Você foi convidado(a) para fazer parte do{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          , a plataforma que conecta os melhores estabelecimentos e profissionais 
          diretamente com os moradores e visitantes da cidade.
        </Text>
        <Text style={text}>
          Ao aceitar este convite, você poderá gerenciar perfis, interagir com a 
          comunidade e aproveitar todas as ferramentas exclusivas que preparamos para você.
        </Text>
        <Text style={text}>
          Clique no botão abaixo para aceitar o convite e completar o seu cadastro:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Aceitar Convite e Começar
        </Button>
        <Text style={footer}>
          Se você não esperava este convite ou não conhece a pessoa/empresa que o enviou, 
          pode ignorar este e-mail. Nenhuma conta será criada sem a sua ação.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
