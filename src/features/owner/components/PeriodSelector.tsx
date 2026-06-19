type Period = 7 | 30 | 90;

export function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-xs">
      {([7, 30, 90] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded-full px-3 py-1 font-medium transition ${
            value === p
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {p}d
        </button>
      ))}
    </div>
  );
}
