import { useEffect, useId, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAutocomplete } from "@/features/companies/hooks/useAutocomplete";

/**
 * Compact search input with debounced autocomplete against
 * search_companies_autocomplete. Keyboard: ArrowUp/Down, Enter, Escape.
 */
export function SearchAutocomplete({ placeholder = "Buscar empresas…" }: { placeholder?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const { data = [], isFetching } = useAutocomplete(q);
  const listboxId = useId();
  const optionIdPrefix = useId();

  const trimmed = q.trim();
  const showList = open && trimmed.length >= 2 && data.length > 0;
  const activeIndex = Math.min(active, Math.max(0, data.length - 1));
  const activeItem = showList ? data[activeIndex] : undefined;
  const activeOptionId = activeItem ? `${optionIdPrefix}-${activeItem.id}` : undefined;

  // Live-region status: results count + currently highlighted option.
  const statusMessage = (() => {
    if (trimmed.length < 2) return "";
    if (isFetching) return "Buscando empresas…";
    if (data.length === 0) return "Nenhuma empresa encontrada.";
    const countMsg =
      data.length === 1
        ? "1 empresa encontrada."
        : `${data.length} empresas encontradas.`;
    if (activeItem) {
      const place = [
        activeItem.neighborhood,
        [activeItem.city_name, activeItem.state].filter(Boolean).join(" - "),
      ]
        .filter(Boolean)
        .join(", ");
      const where = place ? `, ${place}` : "";
      return `${countMsg} Selecionada: ${activeItem.name}${where}. Opção ${activeIndex + 1} de ${data.length}.`;
    }
    return countMsg;
  })();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(id: string) {
    setOpen(false);
    setQ("");
    navigate({ to: "/empresa/$id", params: { id } });
  }

  function submit() {
    if (data[activeIndex]) return go(data[activeIndex].id);
    if (trimmed) navigate({ to: "/buscar", search: { q: trimmed } });
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative flex items-center rounded-full border border-border bg-card shadow-soft">
        <Search className="ml-3 h-4 w-4 text-muted-foreground" aria-hidden />
        <input
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
              setActive((a) => Math.min(a + 1, data.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="h-10 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          aria-controls={showList ? listboxId : undefined}
          aria-activedescendant={activeOptionId}
          aria-label="Buscar empresas"
          maxLength={120}
        />
        {isFetching ? (
          <Loader2 className="mr-3 h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
      </div>
      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Sugestões de empresas"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-2xl border border-border bg-popover p-1 shadow-elegant"
        >
          {data.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                id={`${optionIdPrefix}-${r.id}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.id)}
                role="option"
                aria-selected={i === activeIndex}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${
                  i === activeIndex ? "bg-muted" : "hover:bg-muted/60"
                }`}
              >
                {r.logo_url ? (
                  <img src={r.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" loading="lazy" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-muted" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.name}</p>
                  {(() => {
                    const place = [
                      r.neighborhood,
                      [r.city_name, r.state].filter(Boolean).join(" - "),
                    ]
                      .filter(Boolean)
                      .join(" · ");
                    return place ? (
                      <p className="truncate text-xs text-muted-foreground">{place}</p>
                    ) : null;
                  })()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>
    </div>
  );
}
