import { Star } from "lucide-react";

export function RatingStars({ value, size = 16 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i <= Math.round(v) ? "fill-primary text-primary" : "text-muted-foreground/40"}
        />
      ))}
    </span>
  );
}
