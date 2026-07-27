import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Opções padrão de tamanho de página no admin. */
export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 15;

/**
 * Hook simples de paginação client-side.
 * Reseta a página quando o total muda (por ex., quando o usuário filtra).
 */
export function usePagination<T>(items: readonly T[], initialSize = DEFAULT_PAGE_SIZE) {
  const [pageSize, setPageSize] = useState<number>(initialSize);
  const [page, setPage] = useState(1);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Se o total encolheu (ex: filtro), volta pra última página válida.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const start = (page - 1) * pageSize;
  const paged = useMemo(
    () => items.slice(start, start + pageSize),
    [items, start, pageSize],
  );

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    total,
    paged,
    firstItem: total === 0 ? 0 : start + 1,
    lastItem: Math.min(start + pageSize, total),
  };
}

export type AdminPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  firstItem: number;
  lastItem: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  /** Rótulo do que está sendo listado (ex: "empresas"). */
  label?: string;
};

/**
 * Barra de paginação com primeira, anterior, próxima, última, campo pra ir a
 * uma página específica e seletor de itens por página. Só aparece se houver
 * mais páginas do que o page size atual permite exibir (total > pageSize).
 */
export function AdminPagination(props: AdminPaginationProps) {
  const {
    page,
    totalPages,
    total,
    pageSize,
    firstItem,
    lastItem,
    onPageChange,
    onPageSizeChange,
    label = "itens",
  } = props;

  const [jump, setJump] = useState<string>("");

  if (total <= Math.min(...PAGE_SIZE_OPTIONS)) {
    // ainda mostra o seletor de tamanho quando o total é pequeno? Não:
    // quando o total é menor que a menor opção, não há o que paginar.
  }

  const canPrev = page > 1;
  const canNext = page < totalPages;

  function submitJump() {
    const n = Number(jump);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(1, Math.min(totalPages, Math.round(n)));
    onPageChange(clamped);
    setJump("");
  }

  return (
    <nav
      aria-label="Paginação"
      className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 px-3 py-2 text-xs"
    >
      <p className="text-muted-foreground" aria-live="polite">
        Mostrando <strong>{firstItem}</strong>–<strong>{lastItem}</strong> de{" "}
        <strong>{total}</strong> {label}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-muted-foreground">
          Itens por página
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              onPageSizeChange(Number(v));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="h-7 w-20" aria-label="Itens por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => onPageChange(1)}
            disabled={!canPrev}
            aria-label="Primeira página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => onPageChange(page - 1)}
            disabled={!canPrev}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-1 tabular-nums text-muted-foreground">
            Página <strong className="text-foreground">{page}</strong> de{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </span>

          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNext}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => onPageChange(totalPages)}
            disabled={!canNext}
            aria-label="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitJump();
          }}
          className="flex items-center gap-1"
        >
          <label htmlFor="admin-page-jump" className="sr-only">
            Ir para página
          </label>
          <Input
            id="admin-page-jump"
            value={jump}
            onChange={(e) => setJump(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Ir para…"
            className="h-7 w-20"
            inputMode="numeric"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="h-7"
            disabled={!jump}
          >
            Ir
          </Button>
        </form>
      </div>
    </nav>
  );
}
