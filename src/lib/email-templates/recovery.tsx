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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Instruções para redefinição de senha no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Recuperação de Acesso</Heading>
        <Text style={text}>
          Olá! Recebemos uma solicitação para redefinir a senha da sua conta no {siteName}. 
          Segurança é nossa prioridade, por isso geramos este link temporário para que você 
          possa escolher uma nova credencial com total tranquilidade.
        </Text>
        <Text style={text}>
          Clique no botão abaixo para prosseguir com a criação da sua nova senha:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Definir Nova Senha
        </Button>
        <Text style={footer}>
          Se você não solicitou esta redefinição, não se preocupe: sua senha atual 
          permanece segura e nenhuma alteração foi feita. Basta ignorar este e-mail.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
