import logoSrc from "@/assets/logo-emblem.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold ${className}`}>
      <img
        src={logoSrc}
        alt="Tem na minha cidade"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0"
      />
      <span className="text-lg tracking-tight">
        Tem na <span className="text-secondary">cidade</span>
      </span>
    </span>
  );
}
