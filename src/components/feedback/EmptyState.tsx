import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Search,
  Heart,
  Bell,
  MessageSquare,
  Store,
  Package,
} from "lucide-react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/** Padronizado para "sem dados / lista vazia". */
export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center md:p-10",
        className,
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="mt-4 font-display text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

// Variantes prontas — cada tela consome a que precisa
export const NoSearchResults = (props: Partial<Props>) => (
  <EmptyState
    icon={<Search className="h-6 w-6" />}
    title="Nenhum resultado encontrado"
    description="Tente outros termos de busca ou remova filtros para ampliar os resultados."
    {...props}
  />
);

export const NoFavorites = (props: Partial<Props>) => (
  <EmptyState
    icon={<Heart className="h-6 w-6" />}
    title="Você ainda não favoritou nenhuma empresa"
    description="Toque no coração ao lado de uma empresa para salvar aqui."
    {...props}
  />
);

export const NoNotifications = (props: Partial<Props>) => (
  <EmptyState
    icon={<Bell className="h-6 w-6" />}
    title="Sem notificações por enquanto"
    description="Você verá aqui novidades de empresas que segue, respostas e atualizações."
    {...props}
  />
);

export const NoReviews = (props: Partial<Props>) => (
  <EmptyState
    icon={<MessageSquare className="h-6 w-6" />}
    title="Ainda sem avaliações"
    description="Seja o primeiro a avaliar e ajude outras pessoas a decidirem."
    {...props}
  />
);

export const NoCompanies = (props: Partial<Props>) => (
  <EmptyState
    icon={<Store className="h-6 w-6" />}
    title="Nenhuma empresa por aqui ainda"
    description="Em breve novas empresas serão cadastradas. Volte mais tarde."
    {...props}
  />
);

export const NoProducts = (props: Partial<Props>) => (
  <EmptyState
    icon={<Package className="h-6 w-6" />}
    title="Sem produtos cadastrados"
    description="Esta empresa ainda não publicou produtos ou serviços."
    {...props}
  />
);
