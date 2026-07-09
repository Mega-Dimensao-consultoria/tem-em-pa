import { useState } from "react";
import { Facebook, Linkedin, Link2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { safeCopy } from "@/lib/safe";

type Props = { title: string; url: string; className?: string };

/**
 * Barra de compartilhamento para posts do blog.
 * Botões abrem o compartilhador do provedor em nova aba.
 */
export function ShareBar({ title, url, className }: Props) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links: Array<{
    key: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      icon: <WhatsAppIcon className="h-4 w-4" />,
      color: "hover:text-[#25D366]",
    },
    {
      key: "x",
      label: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: <XIcon className="h-4 w-4" />,
      color: "hover:text-foreground",
    },
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <Facebook className="h-4 w-4" />,
      color: "hover:text-[#1877F2]",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <Linkedin className="h-4 w-4" />,
      color: "hover:text-[#0A66C2]",
    },
  ];

  async function copyLink() {
    const ok = await safeCopy(url);
    if (ok) {
      setCopied(true);
      toast.success("Link copiado");
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/50 px-4 py-3",
        className,
      )}
      role="group"
      aria-label="Compartilhar este post"
    >
      <span className="text-sm font-medium text-muted-foreground">Compartilhar:</span>
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Compartilhar no ${l.label}`}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition",
            l.color,
          )}
        >
          {l.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copiar link"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-sm text-muted-foreground transition hover:text-foreground"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Copiado" : "Copiar link"}
      </button>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.52 3.48A11.85 11.85 0 0 0 12.05 0C5.46 0 .1 5.36.1 11.95c0 2.11.55 4.17 1.6 5.99L0 24l6.22-1.64a11.94 11.94 0 0 0 5.83 1.49h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.19-1.24-6.19-3.49-8.42Zm-8.47 18.4h-.01a9.91 9.91 0 0 1-5.06-1.39l-.36-.22-3.69.97.98-3.6-.24-.37a9.94 9.94 0 0 1-1.52-5.32c0-5.49 4.47-9.96 9.97-9.96 2.66 0 5.16 1.04 7.04 2.93a9.9 9.9 0 0 1 2.91 7.04c0 5.49-4.47 9.96-9.96 9.96Zm5.47-7.46c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37s-1.04 1.01-1.04 2.47c0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.21 5.09 4.5.71.31 1.26.5 1.7.64.71.23 1.36.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2H21.5l-7.5 8.575L23 22h-6.844l-5.36-6.905L4.667 22H1.41l8.019-9.163L1 2h7.02l4.842 6.28L18.244 2Zm-1.2 18h1.895L7.05 4H5.02l12.024 16Z" />
    </svg>
  );
}
