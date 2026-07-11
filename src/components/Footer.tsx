import { Link } from "@tanstack/react-router";
import { Instagram, Facebook } from "lucide-react";
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
          <h2 id="footer-brand" className="sr-only">Sobre o Tem na minha cidade</h2>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            O guia local por cidade. Descubra empresas, produtos e serviços perto de você em várias cidades.
          </p>
          <ul className="mt-4 flex items-center gap-3" aria-label="Redes sociais">
            <li>
              <a
                href="https://www.instagram.com/temnacidadebr"
                target="_blank"
                rel="noopener noreferrer me"
                aria-label="Instagram do Tem na minha cidade"
                className="text-muted-foreground transition hover:text-foreground"
              >
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/temnacidade"
                target="_blank"
                rel="noopener noreferrer me"
                aria-label="Facebook do Tem na minha cidade"
                className="text-muted-foreground transition hover:text-foreground"
              >
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href="https://www.tiktok.com/temnacidade"
                target="_blank"
                rel="noopener noreferrer me"
                aria-label="TikTok do Tem na minha cidade"
                className="text-muted-foreground transition hover:text-foreground"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.87a8.16 8.16 0 0 0 4.77 1.52V6.94a4.85 4.85 0 0 1-1.84-.25Z" />
                </svg>
              </a>
            </li>
          </ul>
        </section>
        <nav aria-labelledby="footer-nav-heading">
          <h4 id="footer-nav-heading" className="mb-3 text-sm font-semibold">Navegar</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Cidades</Link></li>
            <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
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
        © {new Date().getFullYear()} Tem na minha cidade — Todos os direitos reservados.
      </div>
    </footer>
  );
}
