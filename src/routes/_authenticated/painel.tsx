import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Meu painel — Tem em P.A" }] }),
  component: () => <Outlet />,
});
