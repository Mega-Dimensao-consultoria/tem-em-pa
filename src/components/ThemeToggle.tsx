import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const Icon = resolvedTheme === "dark" ? Moon : Sun;

  const items: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Alternar tema"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Icon className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {items.map(({ value, label, icon: ItemIcon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={theme === value ? "bg-accent text-accent-foreground" : ""}
          >
            <ItemIcon className="mr-2 h-4 w-4" /> {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
