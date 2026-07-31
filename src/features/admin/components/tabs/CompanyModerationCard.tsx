import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toastError } from "@/lib/safe";
import { toast } from "sonner";

const KEY = "company_moderation_enabled";

/** Liga/desliga a exigência de aprovação manual para novas empresas. */
export function CompanyModerationCard() {
  const qc = useQueryClient();

  const { data: enabled, isLoading } = useQuery({
    queryKey: ["admin", "settings", KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? "true").toLowerCase() === "true";
    },
  });

  const save = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: KEY, value: next ? "true" : "false" }, { onConflict: "key" });
      if (error) throw error;
      return next;
    },
    onError: (e) => toastError(e, "Falha ao salvar configuração"),
    onSuccess: (next) => {
      qc.invalidateQueries({ queryKey: ["admin", "settings", KEY] });
      toast.success(
        next
          ? "Moderação ativada: novas empresas ficam pendentes de aprovação"
          : "Moderação desativada: novas empresas são publicadas automaticamente",
      );
    },
  });

  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle className="text-base">Moderação do cadastro de empresas</CardTitle>
        <CardDescription>
          Com a moderação ativada, cada empresa cadastrada por um usuário fica pendente até
          um administrador aprovar. Desativada, a empresa é publicada automaticamente no site.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Switch
          id="company-moderation"
          checked={!!enabled}
          disabled={isLoading || save.isPending}
          onCheckedChange={(v) => save.mutate(v)}
        />
        <Label htmlFor="company-moderation" className="cursor-pointer">
          {enabled ? "Exigir aprovação do administrador" : "Publicar automaticamente"}
        </Label>
      </CardContent>
    </Card>
  );
}
