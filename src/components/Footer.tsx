import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { Logo } from "./Logo";
import { useSeoGlobals } from "@/features/seo/functions/settings";
import { DEFAULT_GLOBALS } from "@/lib/seo/types";

export function Footer() {
  const { data: globals } = useSeoGlobals();
  const g = globals ?? DEFAULT_GLOBALS;
  const tagline =
    g.site_tagline ??
    "O guia local por cidade. Descubra empresas, produtos e serviços perto de você.";
  return (
    <footer
      role="contentinfo"
      aria-label="Rodapé do site"
      className="border-t border-border/60 bg-muted/30"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <section aria-labelledby="footer-brand">
          <h2 id="footer-brand" className="sr-only">Sobre o {g.site_name}</h2>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {tagline}
          </p>
          <ul className="mt-4 flex items-center gap-3" aria-label="Redes sociais">
            <li>
              <a
                href="https://www.instagram.com/temnaminhacidade"
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`Instagram do ${g.site_name}`}
                className="text-muted-foreground transition hover:text-foreground"
              >
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/temnaminhacidade"
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`Facebook do ${g.site_name}`}
                className="text-muted-foreground transition hover:text-foreground"
              >
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href="https://www.tiktok.com/temnaminhacidade"
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`TikTok do ${g.site_name}`}
                className="text-muted-foreground transition hover:text-foreground"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.87a8.16 8.16 0 0 0 4.77 1.52V6.94a4.85 4.85 0 0 1-1.84-.25Z" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/@temnaminhacidade.oficial"
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`YouTube do ${g.site_name}`}
                className="text-muted-foreground transition hover:text-foreground"
              >
                <Youtube className="h-5 w-5" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href="https://www.threads.com/@temnaminhacidade"
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`Threads do ${g.site_name}`}
                className="text-muted-foreground transition hover:text-foreground"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.19 2C6.6 2 2.75 5.67 2.75 12s3.85 10 9.44 10c5.06 0 8.7-3.15 8.7-7.5 0-3-1.72-5.13-4.36-5.86-.29-2.36-2.14-3.83-4.63-3.83-1.9 0-3.55.94-4.32 2.44l1.62.94c.44-.85 1.45-1.44 2.7-1.44 1.5 0 2.55.78 2.83 2.13-.63-.09-1.29-.14-1.97-.14-3.44 0-5.62 1.6-5.62 4.05 0 2.28 1.94 3.86 4.42 3.86 2.16 0 3.75-.98 4.55-2.66.75.53 1.19 1.4 1.19 2.51 0 2.05-1.95 3.7-5.15 3.7-4.34 0-7.44-2.9-7.44-8s3.1-8 7.44-8c3.02 0 5.32 1.4 6.55 3.78l1.72-.9C18.6 3.8 15.83 2 12.19 2Zm.05 10.16c.72 0 1.4.06 2.02.18-.19 1.9-1.49 3-3.14 3-1.28 0-2.36-.7-2.36-1.79 0-.94.9-1.39 3.48-1.39Z"/>
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
        © {new Date().getFullYear()} {g.site_name} — Todos os direitos reservados.
      </div>
    </footer>
  );
}
