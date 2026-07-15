import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveCities, type City } from "@/features/cities/functions/list";

/** Normalize (lowercase, strip diacritics) for accent-insensitive matching. */
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Accessible combobox (WAI-ARIA 1.2 pattern) to pick any Brazilian city
 * across all states. Types → filtered listbox. Keyboard: Arrow/Home/End,
 * Enter, Escape. Announces result count and highlighted option via a
 * polite live region (JAWS/NVDA friendly).
 */
export function CityAutocomplete({
  placeholder = "Digite o nome da sua cidade…",
}: {
  placeholder?: string;
}) {
  const navigate = useNavigate();
  const listFn = useServerFn(listActiveCities);
  const { data: cities = [], isLoading } = useQuery({
    queryKey: ["cities", "all-active"],
    queryFn: () => listFn(),
    staleTime: 5 * 60_000,
  });

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const inputId = useId();
  const listboxId = useId();
  const optionIdPrefix = useId();
  const statusId = useId();

  const trimmed = q.trim();
  const results: City[] = useMemo(() => {
    if (trimmed.length < 1) return [];
    const nq = norm(trimmed);
    return cities
      .filter((c) => norm(c.name).includes(nq) || norm(c.state).includes(nq))
      .slice(0, 50);
  }, [cities, trimmed]);

  const showList = open && trimmed.length >= 1;
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));
  const activeItem = showList && results.length > 0 ? results[activeIndex] : undefined;
  const activeOptionId = activeItem ? `${optionIdPrefix}-${activeItem.id}` : undefined;

  // Live-region text for AT (JAWS/NVDA)
  const statusMessage = (() => {
    if (!showList) return "";
    if (isLoading) return "Carregando lista de cidades…";
    if (results.length === 0) return "Nenhuma cidade encontrada.";
    const count =
      results.length === 1
        ? "1 cidade encontrada."
        : `${results.length} cidades encontradas.`;
    if (activeItem) {
      return `${count} Selecionada: ${activeItem.name}, ${activeItem.state}. Opção ${
        activeIndex + 1
      } de ${results.length}. Pressione Enter para abrir.`;
    }
    return `${count} Use as setas para navegar.`;
  })();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Scroll active option into view
  useEffect(() => {
    if (!showList || !activeOptionId) return;
    const el = document.getElementById(activeOptionId);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeOptionId, showList]);

  function go(city: City) {
    setOpen(false);
    setQ("");
    navigate({ to: "/$citySlug", params: { citySlug: city.slug } });
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <label htmlFor={inputId} className="sr-only">
        Buscar cidade
      </label>
      <div className="relative flex items-center rounded-2xl border border-border bg-card shadow-soft focus-within:ring-2 focus-within:ring-primary/40">
        <MapPin className="ml-4 h-5 w-5 text-muted-foreground" aria-hidden />
        <input
          id={inputId}
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (!open) setOpen(true);
              setActive((a) => Math.min(a + 1, Math.max(0, results.length - 1)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Home") {
              if (showList) {
                e.preventDefault();
                setActive(0);
              }
            } else if (e.key === "End") {
              if (showList) {
                e.preventDefault();
                setActive(Math.max(0, results.length - 1));
              }
            } else if (e.key === "Enter") {
              if (activeItem) {
                e.preventDefault();
                go(activeItem);
              }
            } else if (e.key === "Escape") {
              e.preventDefault();
              if (open) setOpen(false);
              else setQ("");
            }
          }}
          placeholder={placeholder}
          className="h-14 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground"
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-describedby={statusId}
          autoComplete="off"
          spellCheck={false}
          maxLength={80}
          enterKeyHint="go"
        />
        {isLoading ? (
          <Loader2 className="mr-4 h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
      </div>

      {showList ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Cidades disponíveis"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-2xl border border-border bg-popover p-1 shadow-elegant"
        >
          {results.length === 0 ? (
            <li
              role="option"
              aria-selected="false"
              aria-disabled="true"
              className="px-4 py-3 text-sm text-muted-foreground"
            >
              Nenhuma cidade encontrada para “{trimmed}”.
            </li>
          ) : (
            results.map((c, i) => (
              <li key={c.id} role="none">
                <button
                  type="button"
                  id={`${optionIdPrefix}-${c.id}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(c)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm ${
                    i === activeIndex ? "bg-muted" : "hover:bg-muted/60"
                  }`}
                >
                  <span className="min-w-0 truncate font-medium">{c.name}</span>
                  <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {c.state}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>
    </div>
  );
}
