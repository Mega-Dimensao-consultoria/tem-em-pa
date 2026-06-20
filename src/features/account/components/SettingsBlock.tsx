import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  tone?: "danger";
  children: ReactNode;
};

/** Card block used by the account settings page to group related controls. */
export function SettingsBlock({ icon, title, tone, children }: Props) {
  return (
    <section
      className={`mt-6 rounded-2xl border bg-card p-5 shadow-soft ${
        tone === "danger" ? "border-destructive/40" : "border-border"
      }`}
    >
      <header className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          {icon}
        </span>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </header>
      {children}
    </section>
  );
}
