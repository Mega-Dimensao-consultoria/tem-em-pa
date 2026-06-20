import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LogOut, ShieldAlert, User as UserIcon, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConfirmDestructive } from "@/components/ConfirmDestructive";
import { useAuth } from "@/features/auth/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { maskPhone, onlyDigits } from "@/lib/masks";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/painel/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Tem em P.A" }] }),
  component: Configuracoes,
});

function Configuracoes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // ---------- Perfil ----------
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ? maskPhone(profile.phone) : "");
  }, [profile]);

  async function saveProfile() {
    if (!user) return;
    if (fullName.trim().length < 2) {
      toast.error("Informe seu nome completo.");
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone ? onlyDigits(phone) : null,
      })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Perfil atualizado.");
    qc.invalidateQueries({ queryKey: ["my-profile", user.id] });
  }

  // ---------- E-mail ----------
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  async function changeEmail() {
    if (!newEmail.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setSavingEmail(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      "Confirme a alteração nos dois e-mails (atual e novo) para concluir a troca.",
    );
    setNewEmail("");
  }

  // ---------- Senha ----------
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  async function changePassword() {
    if (!user?.email) {
      toast.error("Conta sem e-mail. Use redefinição de senha.");
      return;
    }
    if (newPwd.length < 8) {
      toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSavingPwd(true);
    const reauth = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPwd,
    });
    if (reauth.error) {
      setSavingPwd(false);
      toast.error("Senha atual incorreta.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSavingPwd(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada.");
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  }

  // ---------- Sessões ----------
  async function signOutAll() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut({ scope: "global" });
    navigate({ to: "/auth", replace: true });
  }

  // ---------- Excluir conta ----------
  async function deleteAccount() {
    try {
      await deleteMyAccount();
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      toast.success("Sua conta foi excluída.");
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/painel"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize seus dados pessoais, e-mail e senha. Mantenha sua conta segura.
        </p>

        {/* Perfil */}
        <Block icon={<UserIcon className="h-5 w-5" />} title="Perfil">
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
              <Button onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? "Salvando…" : "Salvar perfil"}
              </Button>
            </div>
          </div>
        </Block>

        {/* E-mail */}
        <Block icon={<Mail className="h-5 w-5" />} title="E-mail">
          <p className="mb-2 text-xs text-muted-foreground">
            E-mail atual: <span className="font-medium text-foreground">{user?.email}</span>
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
            <Button variant="outline" onClick={changeEmail} disabled={savingEmail || !newEmail}>
              {savingEmail ? "Enviando…" : "Trocar"}
            </Button>
          </div>
        </Block>

        {/* Senha */}
        <Block icon={<KeyRound className="h-5 w-5" />} title="Senha">
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
                onClick={changePassword}
                disabled={savingPwd || !currentPwd || !newPwd || !confirmPwd}
              >
                {savingPwd ? "Atualizando…" : "Atualizar senha"}
              </Button>
            </div>
          </div>
        </Block>

        {/* Sessões */}
        <Block icon={<LogOut className="h-5 w-5" />} title="Sessões">
          <p className="mb-3 text-sm text-muted-foreground">
            Encerre sua sessão em todos os dispositivos onde está conectado.
          </p>
          <Button variant="outline" onClick={signOutAll}>
            Sair de todos os dispositivos
          </Button>
        </Block>

        <Separator className="my-8" />

        {/* Zona de perigo */}
        <Block
          icon={<ShieldAlert className="h-5 w-5 text-destructive" />}
          title="Excluir conta"
          tone="danger"
        >
          <p className="mb-3 text-sm text-muted-foreground">
            Esta ação remove sua conta de forma permanente, junto com favoritos, avaliações e
            reivindicações associadas. Empresas das quais você é dono ficam sem proprietário e
            voltam para aprovação manual.
          </p>
          <ConfirmDestructive
            trigger={<Button variant="destructive">Excluir minha conta</Button>}
            title="Excluir conta permanentemente?"
            description={
              <p>
                Esta ação não pode ser desfeita. Para confirmar, digite a frase abaixo
                exatamente como aparece.
              </p>
            }
            requirePhrase="EXCLUIR MINHA CONTA"
            confirmText="Excluir conta"
            onConfirm={deleteAccount}
          />
        </Block>
      </section>
    </PageShell>
  );
}

function Block({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`mt-6 rounded-2xl border bg-card p-5 shadow-soft ${
        tone === "danger" ? "border-destructive/40" : "border-border"
      }`}
    >
      <header className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          {icon}
        </span>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </header>
      {children}
    </section>
  );
}
