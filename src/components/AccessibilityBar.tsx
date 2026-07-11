import { useCallback, useEffect, useState } from "react";
import {
  Accessibility,
  Type,
  Contrast,
  Underline,
  MousePointer2,
  Droplet,
  RotateCcw,
  X,
  Minus,
  Plus,
} from "lucide-react";

type A11ySettings = {
  fontScale: number; // 1 = 100%
  highContrast: boolean;
  grayscale: boolean;
  underlineLinks: boolean;
  bigCursor: boolean;
  readableFont: boolean;
};

const DEFAULTS: A11ySettings = {
  fontScale: 1,
  highContrast: false,
  grayscale: false,
  underlineLinks: false,
  bigCursor: false,
  readableFont: false,
};

const STORAGE_KEY = "tnmc-a11y";

function loadSettings(): A11ySettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function applySettings(s: A11ySettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--a11y-font-scale", String(s.fontScale));
  root.classList.toggle("a11y-high-contrast", s.highContrast);
  root.classList.toggle("a11y-grayscale", s.grayscale);
  root.classList.toggle("a11y-underline-links", s.underlineLinks);
  root.classList.toggle("a11y-big-cursor", s.bigCursor);
  root.classList.toggle("a11y-readable-font", s.readableFont);
}

export function AccessibilityBar() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(DEFAULTS);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applySettings(loaded);
  }, []);

  const update = useCallback((patch: Partial<A11ySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      applySettings(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    applySettings(DEFAULTS);
    setSettings(DEFAULTS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const fontPct = Math.round(settings.fontScale * 100);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Fechar recursos de acessibilidade" : "Abrir recursos de acessibilidade"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 left-4 z-[60] inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-elegant transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {open ? <X className="h-5 w-5" /> : <Accessibility className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Recursos de acessibilidade"
          className="fixed bottom-20 left-4 z-[60] w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-elegant"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Acessibilidade</h2>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Restaurar configurações de acessibilidade"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restaurar
            </button>
          </div>

          <div className="space-y-2">
            <div className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Type className="h-4 w-4" /> Tamanho da fonte
                </span>
                <span className="text-xs text-muted-foreground">{fontPct}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => update({ fontScale: Math.max(0.85, settings.fontScale - 0.1) })}
                  aria-label="Diminuir fonte"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, ((settings.fontScale - 0.85) / 0.65) * 100)}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => update({ fontScale: Math.min(1.5, settings.fontScale + 0.1) })}
                  aria-label="Aumentar fonte"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <ToggleRow
              icon={<Contrast className="h-4 w-4" />}
              label="Alto contraste"
              active={settings.highContrast}
              onToggle={() => update({ highContrast: !settings.highContrast })}
            />
            <ToggleRow
              icon={<Droplet className="h-4 w-4" />}
              label="Escala de cinza"
              active={settings.grayscale}
              onToggle={() => update({ grayscale: !settings.grayscale })}
            />
            <ToggleRow
              icon={<Underline className="h-4 w-4" />}
              label="Sublinhar links"
              active={settings.underlineLinks}
              onToggle={() => update({ underlineLinks: !settings.underlineLinks })}
            />
            <ToggleRow
              icon={<MousePointer2 className="h-4 w-4" />}
              label="Cursor ampliado"
              active={settings.bigCursor}
              onToggle={() => update({ bigCursor: !settings.bigCursor })}
            />
            <ToggleRow
              icon={<Type className="h-4 w-4" />}
              label="Fonte legível"
              active={settings.readableFont}
              onToggle={() => update({ readableFont: !settings.readableFont })}
            />
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({
  icon,
  label,
  active,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={active}
      className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-left text-sm transition hover:bg-muted"
    >
      <span className="flex items-center gap-2 font-medium">
        {icon} {label}
      </span>
      <span
        aria-hidden
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
          active ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition ${
            active ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
