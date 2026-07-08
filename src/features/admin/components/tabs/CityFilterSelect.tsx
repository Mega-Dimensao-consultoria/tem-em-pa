import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveCities } from "@/features/cities/functions/list";

type Props = {
  value: string;
  onChange: (v: string) => void;
  label?: string;
};

/**
 * Reusable "todas as cidades" dropdown for admin tabs.
 * Value "all" means no filter. Otherwise a city id.
 */
export function CityFilterSelect({ value, onChange, label = "Cidade" }: Props) {
  const listFn = useServerFn(listActiveCities);
  const { data: cities = [] } = useQuery({
    queryKey: ["admin", "cities-filter"],
    queryFn: () => listFn(),
    staleTime: 60_000,
  });

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
      >
        <option value="all">Todas as cidades</option>
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} / {c.state}
          </option>
        ))}
      </select>
    </label>
  );
}
