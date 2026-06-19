import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = { title: string; text?: string; url?: string; className?: string };

export function ShareButton({ title, text, url, className }: Props) {
  async function onShare() {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
    const data = { title, text: text ?? title, url: shareUrl };
    try {
      const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }) : null;
      if (nav?.share) {
        await nav.share(data);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado para a área de transferência");
    } catch (err) {
      const e = err as Error;
      if (e.name === "AbortError") return;
      toast.error("Não foi possível compartilhar");
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-primary/40",
        className,
      )}
    >
      <Share2 className="h-4 w-4" />
      Compartilhar
    </button>
  );
}
