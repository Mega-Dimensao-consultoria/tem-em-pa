import { Star } from "lucide-react";

export type RatingFilterValue = 0 | 1 | 2 | 3 | 4 | 5;

export function RatingFilter({
  value,
  onChange,
  counts,
}: {
  value: RatingFilterValue;
  onChange: (v: RatingFilterValue) => void;
  counts: Record<number, number>;
}) {
  const options: RatingFilterValue[] = [0, 5, 4, 3, 2, 1];
  return (
    <div
      role="radiogroup"
      aria-label="Filtrar avaliações por nota"
      className="flex flex-wrap gap-1"
    >
      {options.map((n) => {
        const active = value === n;
        const count = n === 0 ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[n] ?? 0;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(n)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
            }`}
          >
            {n === 0 ? (
              "Todas"
            ) : (
              <>
                {n}
                <Star className="h-3 w-3 fill-current" aria-hidden />
              </>
            )}
            <span className="tabular-nums opacity-70">({count})</span>
          </button>
        );
      })}
    </div>
  );
}
