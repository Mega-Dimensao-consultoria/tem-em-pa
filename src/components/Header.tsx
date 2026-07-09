import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth, useRoles } from "@/features/auth/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Heart, LayoutDashboard, LogOut, Shield, Store, User as UserIcon, Building2 } from "lucide-react";
import { NotificationsBell } from "@/features/notifications/components/NotificationsBell";
import { useMyCompaniesCount } from "@/features/owner/hooks/useMyCompaniesCount";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";

export function Header() {
  const { user, loading } = useAuth();
  const { isAdmin, isOwner } = useRoles();
  const { data: companiesCount = 0 } = useMyCompaniesCount();
  const hasCompanies = companiesCount > 0;
  const navigate = useNavigate();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header
      role="banner"
      aria-label="Cabeçalho do site"
      className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="shrink-0" aria-label="Página inicial do Tem na cidade">
          <Logo />
        </Link>

        <div className="hidden max-w-sm flex-1 md:block">
          <SearchAutocomplete placeholder="Buscar empresas…" />
        </div>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-1 lg:flex"
        >
          <Link
            to="/blog"
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
          >
            Blog
          </Link>
          <Link
            to="/sobre"
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
          >
            Sobre
          </Link>
          <Link
            to="/contato"
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
          >
            Contato
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {loading ? null : user ? (
            <>
              <NotificationsBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Menu da conta (${user.email ?? "usuário"})`}
                  className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/painel">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Meu painel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/favoritos">
                    <Heart className="mr-2 h-4 w-4" /> Favoritos
                  </Link>
                </DropdownMenuItem>
                {hasCompanies ? (
                  <DropdownMenuItem asChild>
                    <Link to="/owner">
                      <Building2 className="mr-2 h-4 w-4" /> Minhas empresas
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/cadastrar-empresa">
                      <Store className="mr-2 h-4 w-4" /> Cadastrar empresa
                    </Link>
                  </DropdownMenuItem>
                )}
                {isOwner && !hasCompanies ? (
                  <DropdownMenuItem asChild>
                    <Link to="/owner">
                      <UserIcon className="mr-2 h-4 w-4" /> Painel do proprietário
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" /> Admin
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm" className="rounded-full">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
