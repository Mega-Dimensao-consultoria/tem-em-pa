import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function PageShell({
  children,
  mainLabel = "Conteúdo principal",
}: {
  children: ReactNode;
  mainLabel?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Pular para o conteúdo principal
      </a>
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        role="main"
        aria-label={mainLabel}
        className="flex-1 outline-none"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
