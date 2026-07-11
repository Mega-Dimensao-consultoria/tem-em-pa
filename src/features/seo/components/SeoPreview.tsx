import { Globe } from "lucide-react";

type Props = {
  title: string;
  description: string;
  url: string;
  image?: string | null;
};

/** Preview simples do resultado no Google e no Facebook/Twitter. */
export function SeoPreview({ title, description, url, image }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Google</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" />
          <span className="truncate">{url}</span>
        </div>
        <div className="mt-1 line-clamp-1 text-lg text-[#1a0dab] dark:text-blue-400">
          {title || "Título da página"}
        </div>
        <div className="line-clamp-2 text-sm text-muted-foreground">
          {description || "Descrição aparecerá aqui."}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="border-b border-border p-3 text-xs font-medium text-muted-foreground">
          Facebook / Twitter
        </div>
        {image ? (
          <img
            src={image}
            alt="Preview social"
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-muted text-xs text-muted-foreground">
            Sem imagem social
          </div>
        )}
        <div className="p-3">
          <div className="text-xs uppercase text-muted-foreground">
            {new URL(url || "https://example.com").hostname}
          </div>
          <div className="line-clamp-2 text-sm font-semibold">
            {title || "Título da página"}
          </div>
          <div className="line-clamp-2 text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
    </div>
  );
}
