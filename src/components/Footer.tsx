import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            O guia comercial inteligente de Pouso Alegre. Descubra empresas, produtos e serviços perto de você.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Navegar</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/buscar" className="hover:text-foreground">Buscar empresas</Link></li>
            <li><Link to="/eventos" className="hover:text-foreground">Eventos</Link></li>
            <li><Link to="/cadastrar-empresa" className="hover:text-foreground">Cadastrar empresa</Link></li>
            <li><Link to="/sobre" className="hover:text-foreground">Sobre</Link></li>
            <li><Link to="/contato" className="hover:text-foreground">Contato</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/termos" className="hover:text-foreground">Termos de Uso</Link></li>
            <li><Link to="/privacidade" className="hover:text-foreground">Política de Privacidade</Link></li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Pouso Alegre / MG — conectando moradores e comércio local.
          </p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Tem em P.A — Todos os direitos reservados.
      </div>
    </footer>
  );
}
