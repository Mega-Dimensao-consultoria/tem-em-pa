import { useEffect, useState } from "react";
import { User as UserIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { maskPhone, onlyDigits } from "@/lib/masks";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";
import { SettingsBlock } from "./SettingsBlock";

const HANDLE_RE = /^[a-z0-9_]{3,24}$/;

/** Editable profile: name, phone, public handle/bio, visibility toggle. */
export function ProfileSection() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ? maskPhone(profile.phone) : "");
    setHandle(profile?.handle ?? "");
    setBio(profile?.bio ?? "");
    setIsPublic(profile?.is_public ?? false);
  }, [profile]);

  async function save() {
    if (fullName.trim().length < 2) { toast.error("Informe seu nome completo."); return; }
    const normHandle = handle.trim().toLowerCase();
    if (isPublic && !HANDLE_RE.test(normHandle)) {
      toast.error("Escolha um handle público (3–24 caracteres: a-z, 0-9, _).");
      return;
    }
    try {
      await update.mutateAsync({
        full_name: fullName.trim(),
        phone: phone ? onlyDigits(phone) : null,
        handle: normHandle ? normHandle : null,
        bio: bio.trim() ? bio.trim() : null,
        is_public: isPublic && !!normHandle,
      });
      toast.success("Perfil atualizado.");
    } catch {
      /* toastError já disparado no hook */
    }
  }

  return (
    <SettingsBlock icon={<UserIcon className="h-5 w-5" />} title="Perfil">
      <div className="grid gap-3">
        <div>
          <Label htmlFor="full_name">Nome completo</Label>
          <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Como você quer ser chamado" />
        </div>
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(35) 99999-0000" inputMode="numeric" />
        </div>

        <div className="mt-2 rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Perfil público</p>
              <p className="text-xs text-muted-foreground">
                Quando ativo, qualquer pessoa pode ver seu handle, avatar, bio e avaliações públicas.
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} aria-label="Tornar perfil público" />
          </div>

          <div className="mt-3 grid gap-3">
            <div>
              <Label htmlFor="handle">Handle público</Label>
              <Input
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="ex: joao_silva"
                maxLength={24}
              />
              {handle && HANDLE_RE.test(handle) && isPublic ? (
                <Link
                  to="/u/$handle"
                  params={{ handle }}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Ver perfil público <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">3–24 caracteres: letras, números e underscore.</p>
              )}
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={280} placeholder="Fale um pouco sobre você (opcional)" />
            </div>
          </div>
        </div>

        <div>
          <Button onClick={save} disabled={update.isPending}>{update.isPending ? "Salvando…" : "Salvar perfil"}</Button>
        </div>
      </div>
    </SettingsBlock>
  );
}
