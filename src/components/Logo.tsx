import { MapPin } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold ${className}`}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-hero-gradient text-white shadow-elegant">
        <MapPin className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="text-lg tracking-tight">
        Tem em <span className="text-primary">P.A</span>
      </span>
    </span>
  );
}
