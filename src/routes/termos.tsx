import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Tem em P.A" },
      {
        name: "description",
        content:
          "Termos de Uso do Tem em P.A: regras de utilização da plataforma, direitos e deveres de usuários e empresas cadastradas.",
      },
      { property: "og:title", content: "Termos de Uso — Tem em P.A" },
      {
        property: "og:description",
        content: "Regras de uso da plataforma Tem em P.A.",
      },
      { property: "og:url", content: "https://tem-em-pa.lovable.app/termos" },
    ],
    links: [{ rel: "canonical", href: "https://tem-em-pa.lovable.app/termos" }],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <PageShell>
      <article className="prose prose-neutral mx-auto max-w-3xl px-4 py-16 dark:prose-invert">
        <h1 className="font-display text-4xl font-bold">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <h2>1. Aceitação dos termos</h2>
        <p>
          Ao acessar ou utilizar o <strong>Tem em P.A</strong> ("Plataforma"), você
          concorda com estes Termos de Uso. Se não concordar, não utilize o serviço.
        </p>

        <h2>2. Descrição do serviço</h2>
        <p>
          O Tem em P.A é um guia comercial digital que conecta moradores de Pouso
          Alegre/MG a empresas, produtos e serviços locais. Permitimos que empresas
          divulguem informações e que usuários pesquisem, avaliem e favoritem
          estabelecimentos.
        </p>

        <h2>3. Cadastro e conta</h2>
        <ul>
          <li>Você deve fornecer informações verdadeiras, completas e atualizadas.</li>
          <li>Você é responsável pela guarda da sua senha e por toda atividade em sua conta.</li>
          <li>O uso de autenticação em duas etapas (2FA) é fortemente recomendado.</li>
          <li>Reservamo-nos o direito de suspender contas que violem estes termos.</li>
        </ul>

        <h2>4. Cadastro de empresas</h2>
        <ul>
          <li>Somente o titular ou representante autorizado pode cadastrar/reivindicar uma empresa.</li>
          <li>É proibido cadastrar empresas fictícias, duplicadas ou de terceiros sem autorização.</li>
          <li>As informações passam por moderação antes da publicação.</li>
          <li>Podemos remover cadastros que descumpram estes termos ou a legislação.</li>
        </ul>

        <h2>5. Avaliações e conteúdo do usuário</h2>
        <ul>
          <li>As avaliações devem refletir experiências reais e ser respeitosas.</li>
          <li>É proibido publicar conteúdo ofensivo, discriminatório, difamatório, com dados pessoais de terceiros, spam ou publicidade não autorizada.</li>
          <li>Avaliações passam por moderação automática e podem ser revisadas por nossa equipe.</li>
          <li>Você mantém a titularidade do conteúdo publicado, mas concede ao Tem em P.A licença gratuita e não exclusiva para exibi-lo na plataforma.</li>
        </ul>

        <h2>6. Conduta proibida</h2>
        <p>Você concorda em não:</p>
        <ul>
          <li>Usar a plataforma para fins ilegais ou fraudulentos;</li>
          <li>Tentar acessar áreas restritas ou dados de outros usuários;</li>
          <li>Utilizar robôs, scrapers ou coletar dados em massa;</li>
          <li>Interferir na segurança ou desempenho do serviço.</li>
        </ul>

        <h2>7. Propriedade intelectual</h2>
        <p>
          A marca, o layout, o código e demais elementos da plataforma pertencem ao
          Tem em P.A / Megadimensão. É vedada a reprodução total ou parcial sem
          autorização prévia.
        </p>

        <h2>8. Limitação de responsabilidade</h2>
        <p>
          O Tem em P.A atua como intermediário na divulgação de informações. Não nos
          responsabilizamos por transações, produtos ou serviços prestados pelas
          empresas listadas. Recomendamos sempre validar as informações diretamente
          com o estabelecimento.
        </p>

        <h2>9. Suspensão e encerramento</h2>
        <p>
          Podemos suspender ou encerrar contas que violem estes Termos, sem prejuízo
          das medidas legais cabíveis. Você pode encerrar sua conta a qualquer
          momento nas Configurações.
        </p>

        <h2>10. Alterações</h2>
        <p>
          Estes Termos podem ser atualizados a qualquer momento. Alterações
          relevantes serão comunicadas na plataforma.
        </p>

        <h2>11. Legislação e foro</h2>
        <p>
          Aplica-se a legislação brasileira. Fica eleito o foro da Comarca de Pouso
          Alegre/MG para dirimir eventuais controvérsias.
        </p>

        <h2>12. Contato</h2>
        <p>
          Dúvidas sobre estes Termos:{" "}
          <a href="mailto:contato@megadimensao.com.br">contato@megadimensao.com.br</a>.
        </p>
      </article>
    </PageShell>
  );
}
