import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = {
  name: string;
  slug: string;
  icon: string | null;
  citySlug?: string;
};

export function CategoryCard({ name, slug, icon, citySlug }: Props) {
  const IconCmp = (icon && (Icons as unknown as Record<string, LucideIcon>)[icon]) || Icons.Tag;
  const linkProps = citySlug
    ? ({ to: "/$citySlug/categoria/$catSlug", params: { citySlug, catSlug: slug } } as const)
    : ({ to: "/buscar", search: { cat: slug } } as const);
  return (
    <Link
      {...linkProps}
      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
    >

      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
        <IconCmp className="h-6 w-6" />
      </span>
      <span className="text-sm font-semibold">{name}</span>
    </Link>
  );
}
