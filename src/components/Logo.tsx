import logoSrc from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold ${className}`}>
      <img
        src={logoSrc}
        alt="Tem na cidade"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0"
      />
      <span className="text-lg tracking-tight">
        Tem em <span className="text-primary">P.A</span>
      </span>
    </span>
  );
}
