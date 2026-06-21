import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/safe";

type Props = {
  title?: string;
  description?: string;
  error?: unknown;
  /** Quando passado (vindo de `errorComponent`), o boundary é resetado. */
  reset?: () => void;
  /** Onde voltar caso não haja `reset`. Default: "/". */
  fallbackTo?: "/" | "/buscar";
  className?: string;
};

export function ErrorState({
  title = "Algo deu errado",
  description,
  error,
  reset,
  fallbackTo = "/",
  className,
}: Props) {
  const router = useRouter();
  const safeMessage = description ?? extractErrorMessage(error);

  return (
    <div
      className={cn(
        "rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center md:p-10",
        className,
      )}
      role="alert"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{safeMessage}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button
          onClick={() => {
            router.invalidate();
            reset?.();
          }}
        >
          Tentar novamente
        </Button>
        <Button asChild variant="outline">
          <Link to={fallbackTo}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {fallbackTo === "/" ? "Voltar para a home" : "Ir para a busca"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
