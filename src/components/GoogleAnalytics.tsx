import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const GA_ID = "G-FV2VH1Q9BJ";

const EXCLUDED_PREFIXES = ["/admin"];

function isExcludedPath(pathname: string) {
  return EXCLUDED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    __gaLoaded?: boolean;
  }
}

export function GoogleAnalytics() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const excluded = isExcludedPath(pathname);

  // Load script once when we hit a non-excluded page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (excluded) return;
    if (window.__gaLoaded) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { send_page_view: false });

    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
    window.__gaLoaded = true;
  }, [excluded]);

  // Send a page_view on every route change (non-excluded).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (excluded) return;
    if (!window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: pathname + window.location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, excluded]);

  return null;
}
