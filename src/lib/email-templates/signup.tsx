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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seja muito bem-vindo ao {siteName} - Confirme seu cadastro</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bem-vindo ao {siteName}!</Heading>
        <Text style={text}>
          É um prazer ter você conosco! O{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>{' '}
          é o seu novo guia local completo, facilitando a conexão entre moradores, 
          visitantes e as melhores empresas e profissionais da sua região.
        </Text>
        <Text style={text}>
          Para garantir a segurança da sua conta e liberar o acesso total a todas as 
          nossas funcionalidades — como favoritar locais, deixar avaliações e receber 
          ofertas exclusivas — precisamos que você confirme seu endereço de e-mail (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ).
        </Text>
        <Text style={text}>
          Por favor, clique no botão abaixo para ativar sua conta agora mesmo:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar e Ativar Minha Conta
        </Button>
        <Text style={footer}>
          Caso você não tenha realizado este cadastro, por favor, ignore esta mensagem. 
          Sua conta só será ativada após o clique no botão acima.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
