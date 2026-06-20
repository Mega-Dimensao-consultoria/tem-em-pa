import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP = Icons as unknown as Record<string, LucideIcon>;

export function CategoryIcon({
  name,
  className = "h-5 w-5",
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Cmp = (name && ICON_MAP[name]) || Icons.Tag;
  return <Cmp className={className} aria-hidden="true" />;
}
