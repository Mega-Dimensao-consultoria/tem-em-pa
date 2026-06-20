import { useEffect, useState } from "react";
import { User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskPhone, onlyDigits } from "@/lib/masks";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";
import { SettingsBlock } from "./SettingsBlock";

/** Editable name + phone for the signed-in user. */
export function ProfileSection() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ? maskPhone(profile.phone) : "");
  }, [profile]);

  async function save() {
    if (fullName.trim().length < 2) {
      toast.error("Informe seu nome completo.");
      return;
    }
    await update.mutateAsync({
      full_name: fullName.trim(),
      phone: phone ? onlyDigits(phone) : null,
    });
    toast.success("Perfil atualizado.");
  }

  return (
    <SettingsBlock icon={<UserIcon className="h-5 w-5" />} title="Perfil">
      <div className="grid gap-3">
        <div>
          <Label htmlFor="full_name">Nome completo</Label>
          <Input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Como você quer ser chamado"
          />
        </div>
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            placeholder="(35) 99999-0000"
            inputMode="numeric"
          />
        </div>
        <div>
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending ? "Salvando…" : "Salvar perfil"}
          </Button>
        </div>
      </div>
    </SettingsBlock>
  );
}
