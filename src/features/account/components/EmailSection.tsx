import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/use-auth";
import { requestEmailChange } from "../lib/accountActions";
import { SettingsBlock } from "./SettingsBlock";

/** Lets the user start the email-change confirmation flow. */
export function EmailSection() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const ok = await requestEmailChange(newEmail);
    setSaving(false);
    if (ok) setNewEmail("");
  }

  return (
    <SettingsBlock icon={<Mail className="h-5 w-5" />} title="E-mail">
      <p className="mb-2 text-xs text-muted-foreground">
        E-mail atual:{" "}
        <span className="font-medium text-foreground">{user?.email}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Label htmlFor="new_email">Novo e-mail</Label>
          <Input
            id="new_email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="novo@exemplo.com"
          />
        </div>
        <Button variant="outline" onClick={submit} disabled={saving || !newEmail}>
          {saving ? "Enviando…" : "Trocar"}
        </Button>
      </div>
    </SettingsBlock>
  );
}
