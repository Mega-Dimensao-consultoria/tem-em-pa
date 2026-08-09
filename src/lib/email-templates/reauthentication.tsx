import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de segurança para acesso ao {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verificação de Identidade</Heading>
        <Text style={text}>
          Olá! Para prosseguir com a ação solicitada na sua conta, precisamos confirmar 
          que é realmente você quem está no comando. Este é um procedimento extra de 
          segurança para proteger seus dados.
        </Text>
        <Text style={text}>Utilize o código de verificação abaixo:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Este código possui validade limitada e expira em alguns minutos. Se você 
          não estava tentando realizar nenhuma alteração ou acesso agora, por favor, 
          revisite a segurança da sua conta e ignore esta mensagem.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
