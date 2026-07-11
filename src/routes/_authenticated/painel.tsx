import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Meu painel do usuário — Tem na minha cidade" },
      { name: "description", content: "Gerencie sua conta, avaliações, favoritos, notificações e configurações de segurança no painel do Tem na minha cidade." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <Outlet />,
});
