import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Tem em P.A" },
      {
        name: "description",
        content:
          "Política de Privacidade do Tem em P.A: como coletamos, usamos, armazenamos e protegemos seus dados pessoais, em conformidade com a LGPD.",
      },
      { property: "og:title", content: "Política de Privacidade — Tem em P.A" },
      {
        property: "og:description",
        content: "Como tratamos seus dados no Tem em P.A (LGPD).",
      },
      {
        property: "og:url",
        content: "https://tem-em-pa.lovable.app/privacidade",
      },
    ],
    links: [
      { rel: "canonical", href: "https://tem-em-pa.lovable.app/privacidade" },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <PageShell>
      <article className="prose prose-neutral mx-auto max-w-3xl px-4 py-16 dark:prose-invert">
        <h1 className="font-display text-4xl font-bold">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <p>
          Esta Política descreve como o <strong>Tem em P.A</strong>, operado por
          Megadimensão, trata os dados pessoais dos seus usuários, em conformidade
          com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
        </p>

        <h2>1. Controlador dos dados</h2>
        <p>
          Megadimensão — contato:{" "}
          <a href="mailto:contato@megadimensao.com.br">
            contato@megadimensao.com.br
          </a>
          .
        </p>

        <h2>2. Dados que coletamos</h2>
        <ul>
          <li>
            <strong>Cadastro:</strong> nome, e-mail, foto de perfil, telefone (opcional).
          </li>
          <li>
            <strong>Empresas:</strong> razão social, endereço, contatos, horário, fotos, categoria e produtos cadastrados por proprietários.
          </li>
          <li>
            <strong>Interações:</strong> avaliações, comentários, favoritos, mensagens de contato.
          </li>
          <li>
            <strong>Técnicos:</strong> logs de acesso, IP, navegador, sistema operacional, cookies essenciais e de sessão.
          </li>
          <li>
            <strong>Notificações push:</strong> tokens de dispositivo, quando você autoriza o navegador.
          </li>
        </ul>

        <h2>3. Base legal e finalidades</h2>
        <ul>
          <li>
            <strong>Execução de contrato:</strong> criar e manter sua conta, exibir empresas, viabilizar avaliações e favoritos.
          </li>
          <li>
            <strong>Legítimo interesse:</strong> segurança, prevenção a fraudes, moderação, melhoria de produto.
          </li>
          <li>
            <strong>Consentimento:</strong> envio de notificações push e comunicações opcionais.
          </li>
          <li>
            <strong>Obrigação legal:</strong> atendimento a autoridades quando obrigatório.
          </li>
        </ul>

        <h2>4. Avaliações anônimas</h2>
        <p>
          Você pode marcar uma avaliação como anônima. Nesse caso, o nome do autor
          não é exibido publicamente. Nossa equipe de moderação pode, em casos de
          denúncia ou violação, identificar o autor internamente para investigação.
        </p>

        <h2>5. Compartilhamento</h2>
        <p>Não vendemos dados pessoais. Compartilhamos apenas com:</p>
        <ul>
          <li>Provedores de infraestrutura (banco de dados, e-mail transacional, mapas, hospedagem);</li>
          <li>Autoridades, quando obrigados por lei ou ordem judicial;</li>
          <li>Proprietários das empresas, quando você envia mensagem de contato ou avaliação (respeitada a opção de anonimato).</li>
        </ul>

        <h2>6. Cookies</h2>
        <p>
          Utilizamos cookies essenciais para autenticação e preferências (ex.: tema
          claro/escuro). Não utilizamos cookies de publicidade de terceiros.
        </p>

        <h2>7. Armazenamento e segurança</h2>
        <ul>
          <li>Dados armazenados em infraestrutura com criptografia em trânsito (HTTPS) e em repouso.</li>
          <li>Controle de acesso baseado em papéis (usuário, dono, admin) e políticas de segurança em nível de linha (RLS).</li>
          <li>Suporte a autenticação em duas etapas (2FA) por TOTP.</li>
        </ul>

        <h2>8. Retenção</h2>
        <p>
          Mantemos os dados enquanto sua conta estiver ativa. Após exclusão, dados
          pessoais são removidos ou anonimizados em até 30 dias, ressalvadas
          obrigações legais.
        </p>

        <h2>9. Direitos do titular</h2>
        <p>Você pode, a qualquer momento:</p>
        <ul>
          <li>Acessar, corrigir ou atualizar seus dados nas Configurações;</li>
          <li>Solicitar exportação ou exclusão da conta;</li>
          <li>Revogar consentimento de notificações push;</li>
          <li>Enviar solicitações LGPD para <a href="mailto:contato@megadimensao.com.br">contato@megadimensao.com.br</a>.</li>
        </ul>

        <h2>10. Menores</h2>
        <p>
          O serviço não é destinado a menores de 13 anos. Se identificarmos
          cadastros nessa faixa, a conta será removida.
        </p>

        <h2>11. Alterações desta política</h2>
        <p>
          Podemos atualizar esta Política. Alterações relevantes serão comunicadas
          na plataforma.
        </p>

        <h2>12. Encarregado (DPO)</h2>
        <p>
          Contato do Encarregado pelo Tratamento de Dados:{" "}
          <a href="mailto:contato@megadimensao.com.br">
            contato@megadimensao.com.br
          </a>
          .
        </p>
      </article>
    </PageShell>
  );
}
