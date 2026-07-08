import { Link } from "@tanstack/react-router";
import { Loader2, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SearchSort } from "@/features/companies/hooks/useSearchCompanies";

type Category = { id: string; name: string; slug: string };

export function SearchFilters({
  categories,
  cat,
  sort,
  open,
  hasGeo,
  geoLoading,
  q,
  citySlug,
  onCat,
  onSort,
  onRequestGeo,
  onToggleOpen,
}: {
  categories: Category[];
  cat: string | undefined;
  sort: SearchSort;
  open: boolean | undefined;
  hasGeo: boolean;
  geoLoading: boolean;
  q: string | undefined;
  citySlug?: string;
  onCat: (slug: string | undefined) => void;
  onSort: (v: SearchSort) => void;
  onRequestGeo: () => void;
  onToggleOpen: () => void;
}) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Categoria:
        </span>
        <button
          onClick={() => onCat(undefined)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            !cat ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
          }`}
        >
          Todas
        </button>
        {categories.slice(0, 8).map((c) => (
          <button
            key={c.id}
            onClick={() => onCat(c.slug)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              cat === c.slug ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ordenar por:
        </span>
        <Select value={sort} onValueChange={(v) => onSort(v as SearchSort)}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevância</SelectItem>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="name">Nome (A→Z)</SelectItem>
            <SelectItem value="distance">Mais próximas</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={sort === "distance" && hasGeo ? "default" : "outline"}
          size="sm"
          onClick={onRequestGeo}
          disabled={geoLoading}
          className="h-8 rounded-full text-xs"
        >
          {geoLoading ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Navigation className="mr-1 h-3 w-3" />
          )}
          {hasGeo ? "Atualizar localização" : "Perto de mim"}
        </Button>
        <button
          type="button"
          onClick={onToggleOpen}
          className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition ${
            open ? "bg-emerald-500 text-white" : "bg-muted hover:bg-muted/70"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${open ? "bg-white" : "bg-emerald-500"}`}
          />
          Aberto agora
        </button>
        {q || cat || open ? (
          citySlug ? (
            <Link
              to="/$citySlug/buscar"
              params={{ citySlug }}
              search={{}}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Limpar filtros
            </Link>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Limpar filtros
            </Link>
          )
        ) : null}
      </div>
    </div>
  );
}
