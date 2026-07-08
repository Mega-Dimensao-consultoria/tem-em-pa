import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer
      role="contentinfo"
      aria-label="Rodapé do site"
      className="border-t border-border/60 bg-muted/30"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <section aria-labelledby="footer-brand">
          <h2 id="footer-brand" className="sr-only">Sobre o Tem na cidade</h2>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            O guia local por cidade. Descubra empresas, produtos e serviços perto de você em várias cidades.
          </p>
        </section>
        <nav aria-labelledby="footer-nav-heading">
          <h4 id="footer-nav-heading" className="mb-3 text-sm font-semibold">Navegar</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Cidades</Link></li>
            
            <li><Link to="/cadastrar-empresa" className="hover:text-foreground">Cadastrar empresa</Link></li>
            <li><Link to="/sobre" className="hover:text-foreground">Sobre</Link></li>
            <li><Link to="/contato" className="hover:text-foreground">Contato</Link></li>
          </ul>
        </nav>
        <nav aria-labelledby="footer-legal-heading">
          <h4 id="footer-legal-heading" className="mb-3 text-sm font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/termos" className="hover:text-foreground">Termos de Uso</Link></li>
            <li><Link to="/privacidade" className="hover:text-foreground">Política de Privacidade</Link></li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Conectando moradores e comércio local.
          </p>
        </nav>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Tem na cidade — Todos os direitos reservados.
      </div>
    </footer>
  );
}
