import { Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

export function SearchBar({ defaultValue = "", size = "lg" }: { defaultValue?: string; size?: "lg" | "md" }) {
  const navigate = useNavigate();
  const [q, setQ] = useState(defaultValue);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    navigate({ to: "/buscar", search: { q: q.trim() || undefined } });
  }

  const heights = size === "lg" ? "h-14 text-base" : "h-11 text-sm";

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className={`group relative flex w-full items-center rounded-full border border-border bg-card shadow-soft transition focus-within:border-primary focus-within:shadow-elegant ${heights}`}>
        <Search className="ml-5 h-5 w-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar empresas, produtos ou serviços em Pouso Alegre…"
          className="flex-1 bg-transparent px-3 outline-none placeholder:text-muted-foreground"
          maxLength={120}
        />
        <button
          type="submit"
          className="mr-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
