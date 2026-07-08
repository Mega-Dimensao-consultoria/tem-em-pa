import { useState } from "react";
import { X } from "lucide-react";

/** Thumbnail grid + lightbox for review photos. */
export function ReviewPhotos({ photos }: { photos: string[] | null | undefined }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!photos || photos.length === 0) return null;
  return (
    <>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Fotos da avaliação">
        {photos.map((u) => (
          <li key={u}>
            <button
              type="button"
              onClick={() => setOpen(u)}
              className="block overflow-hidden rounded-lg border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Ampliar foto"
            >
              <img src={u} alt="Foto da avaliação" loading="lazy" className="h-20 w-20 object-cover transition hover:scale-105" />
            </button>
          </li>
        ))}
      </ul>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={open} alt="Foto ampliada" className="max-h-[85vh] max-w-full rounded-xl object-contain" />
        </div>
      ) : null}
    </>
  );
}
