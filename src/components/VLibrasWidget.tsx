import { useEffect } from "react";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
  }
}

const SCRIPT_SRC = "https://vlibras.gov.br/app/vlibras-plugin.js";

/**
 * Integração oficial do VLibras (Governo Federal) para tradução de conteúdo
 * em Libras. Carrega o plugin uma única vez e instancia o widget.
 */
export function VLibrasWidget() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    function init() {
      try {
        if (window.VLibras?.Widget) {
          new window.VLibras.Widget("https://vlibras.gov.br/app");
        }
      } catch (err) {
        console.warn("[VLibras] init failed", err);
      }
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      if (window.VLibras?.Widget) init();
      else existing.addEventListener("load", init, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", init, { once: true });
    document.body.appendChild(script);
  }, []);

  return (
    <div {...({ vw: "true" } as Record<string, string>)} className="enabled">
      <div {...({ "vw-access-button": "true" } as Record<string, string>)} className="active" />
      <div {...({ "vw-plugin-wrapper": "true" } as Record<string, string>)}>
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
  );
}
