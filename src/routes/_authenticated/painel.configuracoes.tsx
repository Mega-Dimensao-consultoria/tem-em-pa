import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Separator } from "@/components/ui/separator";
import { ProfileSection } from "@/features/account/components/ProfileSection";
import { EmailSection } from "@/features/account/components/EmailSection";
import { PasswordSection } from "@/features/account/components/PasswordSection";
import {
  SessionsSection,
  DangerZoneSection,
} from "@/features/account/components/DangerSections";
import { PushSettingsCard } from "@/features/notifications/components/PushSettingsCard";
import { SecuritySection } from "@/features/security/components/SecuritySection";

export const Route = createFileRoute("/_authenticated/painel/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Tem na cidade" }] }),
  component: Configuracoes,
});

function Configuracoes() {
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

        <ProfileSection />
        <EmailSection />
        <PasswordSection />
        <SecuritySection />
        <PushSettingsCard />
        <SessionsSection />

        <Separator className="my-8" />

        <DangerZoneSection />
      </section>
    </PageShell>
  );
}
