import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="h-5 w-5" />
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export function Loading() {
  return (
    <div className="mt-4 space-y-2" aria-busy="true" aria-live="polite">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-3/4" />
    </div>
  );
}


export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}
