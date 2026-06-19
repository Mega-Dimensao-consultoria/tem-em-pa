import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function FormField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
