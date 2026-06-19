import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";

type Company = {
  id: string;
  logo_url?: string | null;
  cover_url?: string | null;
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  hours?: unknown;
  gallery_urls?: string[] | null;
  lat?: number | null;
  lng?: number | null;
};

type Item = { key: string; label: string; done: boolean };

export function ProfileCompleteness({ company }: { company: Company }) {
  const hasHours = Array.isArray(company.hours) && (company.hours as { closed?: boolean }[]).some((h) => !h?.closed);
  const hasGallery = Array.isArray(company.gallery_urls) && company.gallery_urls.length >= 3;
  const hasContact = !!(company.phone || company.whatsapp);
  const hasSocial = !!(company.instagram_url || company.facebook_url || company.website);

  const items: Item[] = [
    { key: "logo", label: "Adicionar logo", done: !!company.logo_url },
    { key: "cover", label: "Adicionar foto de capa", done: !!company.cover_url },
    { key: "description", label: "Descrição com pelo menos 80 caracteres", done: (company.description?.trim().length ?? 0) >= 80 },
    { key: "contact", label: "Telefone ou WhatsApp", done: hasContact },
    { key: "hours", label: "Horário de funcionamento", done: hasHours },
    { key: "location", label: "Endereço geolocalizado", done: company.lat != null && company.lng != null },
    { key: "gallery", label: "Galeria com 3+ fotos", done: hasGallery },
    { key: "social", label: "Site ou redes sociais", done: hasSocial },
  ];

  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold">Perfil completo</h3>
          <p className="text-xs text-muted-foreground">Perfis completos aparecem com mais destaque nas buscas.</p>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold">{pct}%</div>
          <div className="text-[10px] text-muted-foreground">{done} de {items.length}</div>
        </div>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-1.5 text-sm">
        {items.map((it) => (
          <li key={it.key} className="flex items-center gap-2">
            {it.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={it.done ? "text-muted-foreground line-through" : ""}>{it.label}</span>
          </li>
        ))}
      </ul>
      {pct < 100 ? (
        <div className="mt-4">
          <Link
            to="/owner/empresa/$id/editar"
            params={{ id: company.id }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Completar agora
          </Link>
        </div>
      ) : null}
    </div>
  );
}
