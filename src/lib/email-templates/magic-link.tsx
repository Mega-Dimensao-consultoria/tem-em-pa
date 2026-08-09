import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso rápido para o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Seu Acesso Instantâneo</Heading>
        <Text style={text}>
          Você solicitou um link de acesso rápido para entrar na sua conta no {siteName} 
          sem precisar digitar sua senha. Esta é uma forma segura e prática de se conectar.
        </Text>
        <Text style={text}>
          Clique no botão abaixo para ser autenticado automaticamente. Por segurança, 
          este link é de uso único e expira em alguns minutos:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Entrar Agora na Minha Conta
        </Button>
        <Text style={footer}>
          Se você não solicitou este link de acesso, pode ignorar este e-mail com 
          total segurança. Ninguém terá acesso à sua conta sem que o botão acima seja clicado.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
