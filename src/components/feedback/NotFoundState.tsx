import { Compass } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  className?: string;
};

export function NotFoundState({
  title = "Não encontramos esta página",
  description = "O endereço pode ter sido movido, removido ou nunca existiu.",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center md:p-10",
        className,
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 flex justify-center">
        <Button asChild>
          <Link to="/">Voltar para a home</Link>
        </Button>
      </div>
    </div>
  );
}
