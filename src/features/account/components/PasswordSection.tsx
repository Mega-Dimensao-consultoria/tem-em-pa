import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/use-auth";
import { changePassword } from "../lib/accountActions";
import { SettingsBlock } from "./SettingsBlock";

/** Re-auth + password rotation for email/password users. */
export function PasswordSection() {
  const { user } = useAuth();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await changePassword({
      email: user?.email,
      currentPassword: currentPwd,
      newPassword: newPwd,
      confirmPassword: confirmPwd,
    });
    setSaving(false);
    if (ok) {
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    }
  }

  return (
    <SettingsBlock icon={<KeyRound className="h-5 w-5" />} title="Senha">
      <div className="grid gap-3">
        <div>
          <Label htmlFor="cur_pwd">Senha atual</Label>
          <Input
            id="cur_pwd"
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div>
          <Label htmlFor="new_pwd">Nova senha</Label>
          <Input
            id="new_pwd"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label htmlFor="conf_pwd">Confirmar nova senha</Label>
          <Input
            id="conf_pwd"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <Button
            onClick={submit}
            disabled={saving || !currentPwd || !newPwd || !confirmPwd}
          >
            {saving ? "Atualizando…" : "Atualizar senha"}
          </Button>
        </div>
      </div>
    </SettingsBlock>
  );
}
