export function CompanyGalleryBlock({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold">Galeria</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {urls.map((url, i) => (
          <a
            key={url + i}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="group relative aspect-square overflow-hidden rounded-xl border border-border"
          >
            <img
              src={url}
              alt={`Foto ${i + 1}`}
              className="h-full w-full object-cover transition group-hover:scale-105"
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
