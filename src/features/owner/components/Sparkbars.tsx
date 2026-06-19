export function Sparkbars({
  data,
  max,
  color,
}: {
  data: { label: string; count: number }[];
  max: number;
  color: string;
}) {
  return (
    <>
      <div className="flex h-32 items-end gap-1">
        {data.map((d, i) => (
          <div key={d.label + i} className="group relative flex flex-1 flex-col items-center">
            <div
              className={`w-full rounded-t ${color} transition group-hover:opacity-100`}
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 2 : 0 }}
              title={`${d.label}: ${d.count}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </>
  );
}
