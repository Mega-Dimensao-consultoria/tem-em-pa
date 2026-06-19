import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  companyId: string;
  variant?: "icon" | "button";
  className?: string;
};

export function FavoriteButton({ companyId, variant = "icon", className }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favored, setFavored] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!user) {
      setFavored(false);
      return;
    }
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setFavored(!!data);
      });
    return () => {
      alive = false;
    };
  }, [user, companyId]);

  async function toggle(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!user) {
      toast.info("Entre para salvar favoritos");
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    if (favored) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("company_id", companyId);
      if (!error) {
        setFavored(false);
        toast.success("Removido dos favoritos");
      } else toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, company_id: companyId });
      if (!error) {
        setFavored(true);
        toast.success("Adicionado aos favoritos");
      } else toast.error(error.message);
    }
    setBusy(false);
  }

  if (variant === "button") {
    return (
      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={favored}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-primary/40 disabled:opacity-50",
          favored && "border-primary/40 text-primary",
          className,
        )}
      >
        <Heart className={cn("h-4 w-4", favored && "fill-current")} />
        {favored ? "Salvo" : "Salvar"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={favored ? "Remover dos favoritos" : "Salvar nos favoritos"}
      aria-pressed={favored}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground/70 shadow-soft backdrop-blur transition hover:text-primary disabled:opacity-50",
        favored && "text-primary",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", favored && "fill-current")} />
    </button>
  );
}
