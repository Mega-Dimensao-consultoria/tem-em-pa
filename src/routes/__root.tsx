import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingDialog } from "@/features/auth/components/OnboardingDialog";
import { AuthProvider } from "@/features/auth/use-auth";
import { PushPermissionBanner } from "@/features/notifications/components/PushPermissionBanner";
import { PushBootstrap } from "@/features/notifications/components/PushBootstrap";
import { ThemeProvider, themeNoFlashScript } from "@/components/ThemeProvider";
import { AccessibilityBar } from "@/components/AccessibilityBar";
import { VLibrasWidget } from "@/components/VLibrasWidget";
import { PWARegister } from "@/components/PWARegister";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço que você procura não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Voltar para a home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          Algo deu errado ao carregar esta página
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente novamente em alguns instantes ou volte para a home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            Ir para a home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tem na cidade — o guia local por cidade" },
      { name: "description", content: "Descubra restaurantes, mercados, serviços e comércio local em várias cidades." },
      { name: "author", content: "Tem na cidade" },
      { name: "theme-color", content: "#d23030" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Tem na cidade" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        children: themeNoFlashScript,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Tem na cidade",
          url: "https://pousoalegre.megadimensao.com.br",
          logo: "https://pousoalegre.megadimensao.com.br/favicon.png",
        }),
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      const isAuthRoute =
        typeof window !== "undefined" && window.location.pathname.startsWith("/auth");
      if (event === "SIGNED_OUT") {
        queryClient.clear();
        return;
      }
      if (!isAuthRoute) {
        window.setTimeout(async () => {
          try {
            const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aal?.nextLevel === "aal2" && aal.currentLevel === "aal1") {
              window.location.replace("/auth/two-factor");
            }
          } catch {
            /* ignore */
          }
        }, 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PWARegister />
          <PushBootstrap />
          <PushPermissionBanner />
          <Outlet />
          <OnboardingDialog />
          <Toaster richColors position="top-center" containerAriaLabel="Central de notificações" />
          <AccessibilityBar />
          <VLibrasWidget />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
