# Rotina de teste E2E — Reset de 2FA em produção

Objetivo: validar que um usuário com 2FA ativo consegue solicitar a redefinição
do segundo fator via suporte e recuperar o acesso à conta.

## Pré-requisitos

- 2 contas em produção:
  - `qa+admin@megadimensao.com.br` (papel `admin`)
  - `qa+user@megadimensao.com.br` (papel `user`, 2FA TOTP ativo)
- Acesso à caixa `contato@megadimensao.com.br` para acompanhar e-mails
  transacionais (encaminhamento das notificações administrativas).
- Um aplicativo TOTP (Google Authenticator / 1Password) já cadastrado na conta
  de usuário.

## Fluxo esperado

1. **Ativar 2FA no usuário QA**
   - Entrar em `Painel > Segurança > Ativar 2FA (TOTP)`.
   - Confirmar código do app autenticador.
   - Guardar/apagar propositalmente os códigos de recuperação para simular a
     perda.

2. **Simular perda do 2FA**
   - Fazer sign-out. Ir em `/auth`, digitar e-mail + senha.
   - Na tela `/auth/two-factor`, clicar em **"Perdi meu segundo fator"**.
   - A rota `/suporte/redefinir-2fa` deve abrir, permitindo enviar a
     solicitação (motivo + telefone opcional).
   - Enviar. A UI deve confirmar "Solicitação registrada".

3. **Verificar registro**
   - No painel admin (`/admin > Solicitações de reset 2FA`) a solicitação
     deve aparecer com status `pending`.
   - Confirmar que o admin recebeu **push notification** (se registrado) e
     e-mail `contato@megadimensao.com.br` (canal padrão de notificações
     administrativas).

4. **Aprovar / Rejeitar como admin**
   - Aprovar a solicitação. O status muda para `approved` e a linha em
     `two_fa_email_otp` é criada (via trigger/RPC do backend), com envio de
     OTP por e-mail para o usuário.
   - O usuário recebe e-mail transacional com o código temporário
     (template `two-fa-recovery`).

5. **Concluir reset pelo usuário**
   - Usuário retorna à tela de login, insere e-mail + senha e é levado ao
     fluxo `/auth/two-factor` com opção "usar código de recuperação por
     e-mail".
   - Insere o OTP recebido. Deve autenticar e reabrir prompt para
     re-cadastrar TOTP (ou permitir seguir sem 2FA).

6. **Pós-teste**
   - Reativar 2FA na conta QA.
   - Marcar a solicitação como resolvida no admin.
   - Registrar no changelog de QA (data, tester, screenshot de cada etapa).

## Cadência recomendada

- **Mensal** em produção.
- Após qualquer alteração nos módulos `features/security`, `lib/twofa.functions.ts`
  ou templates `two-fa-recovery`.

## Critérios de aceitação

- ✅ Solicitação chega ao admin com push + e-mail em <2 min.
- ✅ Aprovação gera OTP e envia por e-mail em <2 min.
- ✅ OTP tem validade curta (~10 min) — expirar propositalmente uma vez para
     validar rejeição de códigos vencidos.
- ✅ Nenhum e-mail relacionado à conta é enviado a endereços diferentes do
     titular.
- ✅ Após uso, o OTP é invalidado (tentar reutilizar deve falhar).

## Registro

Manter planilha (Drive) `Tem em P.A > QA > 2FA reset log` com colunas:
`data | tester | conta usada | tempo total | resultado | observações`.
