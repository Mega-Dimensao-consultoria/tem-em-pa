import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const ICON_MAP = Icons as unknown as Record<string, LucideIcon>;

const SUGGESTED = [
  "Store", "ShoppingBag", "ShoppingCart", "Utensils", "Coffee", "Pizza",
  "Beer", "Wine", "Cake", "IceCream", "Apple", "Carrot",
  "Scissors", "Shirt", "Glasses", "Gem", "Brush", "Palette",
  "Wrench", "Hammer", "Car", "Bike", "Plane", "Hotel",
  "Home", "Building2", "Briefcase", "GraduationCap", "BookOpen", "Music",
  "Camera", "Film", "Gamepad2", "Dumbbell", "Heart", "Stethoscope",
  "Pill", "Baby", "PawPrint", "Flower", "TreePine", "Sun",
  "Smartphone", "Laptop", "Wifi", "Wrench", "Sparkles", "Tag",
];

function isValidIcon(name: string): boolean {
  const cand = ICON_MAP[name];
  return Boolean(cand) && typeof cand !== "string";
}

export function IconPicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  id?: string;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? Object.keys(ICON_MAP).filter(
          (k) =>
            /^[A-Z]/.test(k) &&
            k.toLowerCase().includes(q) &&
            isValidIcon(k),
        )
      : SUGGESTED.filter(isValidIcon);
    return base.slice(0, 96);
  }, [query]);

  const SelectedIcon = value && isValidIcon(value) ? ICON_MAP[value] : Icons.Tag;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-background text-foreground"
        >
          <SelectedIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Ícone selecionado</p>
          <p className="truncate text-sm font-medium">
            {value && isValidIcon(value) ? value : "Nenhum (padrão: Tag)"}
          </p>
        </div>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange("")}
            aria-label="Remover ícone selecionado"
          >
            Limpar
          </Button>
        ) : null}
      </div>

      <Input
        id={id}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar ícone (ex: store, coffee, heart)"
        aria-label="Buscar ícone"
      />

      <ScrollArea className="h-56 rounded-lg border border-border">
        <div
          role="listbox"
          aria-label="Ícones disponíveis"
          className="grid grid-cols-6 gap-1 p-2 sm:grid-cols-8"
        >
          {results.map((name) => {
            const Cmp = ICON_MAP[name];
            const selected = name === value;
            return (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={name}
                title={name}
                onClick={() => onChange(name)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md border border-transparent text-foreground transition hover:border-border hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected && "border-primary bg-primary/10 text-primary",
                )}
              >
                <Cmp className="h-5 w-5" aria-hidden="true" />
              </button>
            );
          })}
          {results.length === 0 ? (
            <p className="col-span-full p-4 text-center text-sm text-muted-foreground">
              Nenhum ícone encontrado.
            </p>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
